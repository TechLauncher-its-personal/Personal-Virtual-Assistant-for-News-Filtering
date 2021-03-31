// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2019-2020 The Board of Trustees of the Leland Stanford Junior University
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Author: Giovanni Campagna <gcampagn@cs.stanford.edu>
"use strict";

const express = require('express');

const db = require('../util/db');
const organization = require('../model/organization');
const device = require('../model/device');
const oauth2 = require('../model/oauth2');
const userModel = require('../model/user');
const nlpModelsModel = require('../model/nlp_models');
const templatePackModel = require('../model/template_files');
const trainingJobModel = require('../model/training_job');
const user = require('../util/user');
const SendMail = require('../util/sendmail');
const iv = require('../util/input_validation');
const { tokenize } = require('../util/tokenize');
const { BadRequestError } = require('../util/errors');
const creditSystem = require('../util/credit_system');

const Config = require('../config');

const EngineManager = require('../almond/enginemanagerclient');

var router = express.Router();

const HAS_ABOUT_GET_INVOLVED = Config.EXTRA_ABOUT_PAGES.some((p) => p.url === 'get-involved');

const DEFAULT_TRAINING_CONFIG = JSON.stringify({
    synthetic_depth: 7,
    dataset_target_pruning_size: 1000,
    dataset_quoted_probability: 0.1,
    dataset_eval_probability: 0.5,
    dataset_split_strategy: 'sentence',
    train_iterations: 100000,
    train_batch_tokens: 4000,
    val_batch_size: 128,
    seq2seq_encoder: 'Identity',
    dimension: 768,
    rnn_dimension: 768,
    transformer_hidden: 768,
    transformer_layers: 0,
    rnn_layers: 2,
    rnn_zero_state: 'average',
    context_embeddings: 'bert-base-uncased',
    question_embeddings: 'bert-base-uncased',
    decoder_embeddings: '',
    trainable_encoder_embeddings: 0,
    trainable_decoder_embeddings: 25,
    transformer_lr_multiply: 0.5
}, undefined, 2);
const DEFAULT_CUSTOM_DATASET_CONFIG = JSON.stringify({
    synthetic_depth: 7,
    target_pruning_size: 10000,
}, undefined, 2);

router.get('/', (req, res, next) => {
    if (!req.user || !req.user.developer_org) {
        if (HAS_ABOUT_GET_INVOLVED)
            res.redirect('/about/get-involved');
        else
            res.redirect('/user/request-developer');
        return;
    }

    db.withTransaction((dbClient) => {
        return Promise.all([
            organization.get(dbClient, req.user.developer_org),
            organization.getMembers(dbClient, req.user.developer_org),
            organization.getInvitations(dbClient, req.user.developer_org),
            organization.getStatistics(dbClient, req.user.developer_org)
        ]);
    }).then(([developer_org, developer_org_members, developer_org_invitations, developer_org_stats]) => {
        res.render('dev_overview', { page_title: req._("Almond Developer Console"),
                                                csrfToken: req.csrfToken(),
                                                developer_org,
                                                developer_org_members,
                                                developer_org_invitations,
                                                developer_org_stats,
                                                credit_update_value: creditSystem.getCreditUpdate(developer_org_stats),
                                                credit_update_time: creditSystem.getNextUpdate(developer_org.last_credit_update),
        });
    }).catch(next);
});

router.get('/oauth', user.requireLogIn, user.requireDeveloper(), (req, res, next) => {
    db.withClient((dbClient) => {
        return oauth2.getClientsByOwner(dbClient, req.user.developer_org);
    }).then((developer_oauth2_clients) => {
        res.render('dev_oauth', { page_title: req._("Almond Developer Console - OAuth 2.0 Applications"),
                                             csrfToken: req.csrfToken(),
                                             developer_oauth2_clients: developer_oauth2_clients
        });
    }).catch(next);
});

router.post('/organization/add-member', user.requireLogIn, user.requireDeveloper(user.DeveloperStatus.ORG_ADMIN), (req, res, next) => {
    db.withTransaction(async (dbClient) => {
        const [row] = await userModel.getByName(dbClient, req.body.username);
        try {
            if (!row)
                throw new BadRequestError(req._("No such user %s").format(req.body.username));
            if (row.developer_org !== null)
                throw new BadRequestError(req._("%s is already a member of another developer organization.").format(req.body.username));
            if (!row.email_verified)
                throw new BadRequestError(req._("%s has not verified their email address yet.").format(req.body.username));
        } catch(e) {
            res.status(400).render('error', { page_title: req._("Almond - Error"),
                                              message: e });
            return false;
        }
        // check if the user was already invited to this org
        // if so, we do nothing, silently
        const [invitation] = await organization.findInvitation(dbClient, req.user.developer_org, row.id);
        if (invitation)
            return true;

        const org = await organization.get(dbClient, req.user.developer_org);

        let developerStatus = parseInt(req.body.developer_status);
        if (isNaN(developerStatus) || developerStatus < 0)
            developerStatus = 0;
        if (developerStatus > user.DeveloperStatus.ORG_ADMIN)
            developerStatus = user.DeveloperStatus.ORG_ADMIN;

        await sendInvitationEmail(req.user, org, row);
        await organization.inviteUser(dbClient, req.user.developer_org, row.id, developerStatus);
        return true;
    }).then((ok) => {
        if (ok)
            res.redirect(303, '/developers');
    }).catch(next);
});

async function sendInvitationEmail(fromUser, org, toUser) {
    const mailOptions = {
        from: Config.EMAIL_FROM_USER,
        to: toUser.email,
        subject: 'You are invited to join a Thingpedia developer organization',
        text:
`Hello!

${fromUser.human_name || fromUser.username} is inviting you to join the “${org.name}” developer organization.
To accept, click here:
<${Config.SERVER_ORIGIN}/developers/organization/accept-invitation/${org.id_hash}>

----
You are receiving this email because this address is associated
with your Almond account.
`
    };

    return SendMail.send(mailOptions);
}

router.get('/organization/accept-invitation/:id_hash', user.requireLogIn, (req, res, next) => {
    db.withTransaction(async (dbClient) => {
        let org, invitation;
        try {
            if (req.user.developer_org !== null)
                throw new BadRequestError(req._("You are already a member of another developer organization."));

            org = await organization.getByIdHash(dbClient, req.params.id_hash);

            [invitation] = await organization.findInvitation(dbClient, org.id, req.user.id);
            if (!invitation)
                throw new BadRequestError(req._("The invitation is no longer valid. It might have expired or might have been rescinded by the organization administrator."));
        } catch(e) {
            res.status(400).render('error', { page_title: req._("Almond - Error"),
                                              message: e });
            return [null, null];
        }

        await user.makeDeveloper(dbClient, req.user.id, org.id, invitation.developer_status);
        await organization.rescindAllInvitations(dbClient, req.user.id);
        return [req.user.id, org.name];
    }).then(async ([userId, orgName]) => {
        if (userId !== null) {
            await EngineManager.get().restartUser(userId);
            res.render('message', {
                page_title: req._("Almond - Developer Invitation"),
                message: req._("You're now a member of the %s organization.").format(orgName)
            });
        }
    }).catch(next);
});

router.post('/organization/rescind-invitation', user.requireLogIn, user.requireDeveloper(user.DeveloperStatus.ORG_ADMIN), (req, res, next) => {
    db.withTransaction(async (dbClient) => {
        const [row] = await userModel.getByCloudId(dbClient, req.body.user_id);
        if (!row)
            throw new BadRequestError(req._("No such user"));

        await organization.rescindInvitation(dbClient, req.user.developer_org, row.id);
    }).then(() => {
        res.redirect(303, '/developers');
    }).catch(next);
});

router.post('/organization/remove-member', user.requireLogIn, user.requireDeveloper(user.DeveloperStatus.ORG_ADMIN), (req, res, next) => {
    db.withTransaction(async (dbClient) => {
        const users = await userModel.getByCloudId(dbClient, req.body.user_id);
        if (users[0].cloud_id === req.user.cloud_id)
            throw new BadRequestError(req._("You cannot remove yourself from your developer organization."));
        if (users.length === 0)
            throw new BadRequestError(req._("No such user"));
        if (users[0].developer_org !== req.user.developer_org)
            throw new BadRequestError(req._("The user is not a member of your developer organization."));

        await user.makeDeveloper(dbClient, users[0].id, null);
        const userId = users[0].id;
        await EngineManager.get().restartUserWithoutCache(userId);
        res.redirect(303, '/developers');
    }).catch(next);
});

router.post('/organization/promote', user.requireLogIn, user.requireDeveloper(user.DeveloperStatus.ORG_ADMIN), (req, res, next) => {
    db.withTransaction(async (dbClient) => {
        const users = await userModel.getByCloudId(dbClient, req.body.user_id);
        if (users.length === 0)
            throw new BadRequestError(req._("No such user"));
        if (users[0].developer_org !== req.user.developer_org)
            throw new BadRequestError(req._("The user is not a member of your developer organization."));
        if (users[0].developer_status >= user.DeveloperStatus.ORG_ADMIN)
            return;

        await userModel.update(dbClient, users[0].id, {
            developer_status: users[0].developer_status + 1,
        });
    }).then(() => {
        res.redirect(303, '/developers');
    }).catch(next);
});

router.post('/organization/demote', user.requireLogIn, user.requireDeveloper(user.DeveloperStatus.ORG_ADMIN), (req, res, next) => {
    db.withTransaction(async (dbClient) => {
        const users = await userModel.getByCloudId(dbClient, req.body.user_id);
        if (users[0].cloud_id === req.user.cloud_id)
            throw new BadRequestError(req._("You cannot demote yourself."));
        if (users.length === 0)
            throw new BadRequestError(req._("No such user"));
        if (users[0].developer_org !== req.user.developer_org)
            throw new BadRequestError(req._("The user is not a member of your developer organization."));
        if (users[0].developer_status <= 0)
            return;

        await userModel.update(dbClient, users[0].id, {
            developer_status: users[0].developer_status - 1,
        });
    }).then(() => {
        res.redirect(303, '/developers');
    }).catch(next);
});

router.post('/organization/edit-profile', user.requireLogIn, user.requireDeveloper(user.DeveloperStatus.ORG_ADMIN),
    iv.validatePOST({ name: 'string' }), (req, res, next) => {
    for (let token of tokenize(req.body.name)) {
        if (['stanford', 'almond'].indexOf(token) >= 0) {
            res.status(400).render('error', { page_title: req._("Almond - Error"),
                                              message: req._("You cannot use the word “%s” in your organization name.").format(token) });
            return;
        }
    }

    db.withTransaction((dbClient) => {
        return organization.update(dbClient, req.user.developer_org, { name: req.body.name });
    }).then(() => {
        res.redirect(303, '/developers');
    }).catch(next);
});


router.get('/train', user.requireLogIn, (req, res) => {
    res.render('dev_train_almond', { page_title: req._("Almond - Train Almond"), csrfToken: req.csrfToken() });
});

router.get('/status', (req, res) => {
    res.redirect('/me/status');
});

if (Config.WITH_LUINET === 'embedded') {
    router.get('/models', user.requireLogIn, user.requireDeveloper(), (req, res, next) => {
        db.withClient(async (dbClient) => {
            const [models, templatePacks, trainingJobs] = await Promise.all([
                nlpModelsModel.getByOwner(dbClient, req.user.developer_org),
                templatePackModel.getByOwner(dbClient, req.user.developer_org),
                trainingJobModel.getRecent(dbClient, ['train', 'gen-custom-synthetic', 'gen-custom-augmented', 'gen-custom-turking']),
            ]);
            for (let model of models) {
                if (model.metrics)
                    model.metrics = JSON.parse(model.metrics);

                model.current_job = null;
                for (let job of trainingJobs) {
                    if (job.job_type !== 'train' || ['started', 'queued'].indexOf(job.status) < 0)
                        continue;
                    if (model.language === job.language && model.tag === job.model_tag) {
                        model.current_job = job;
                        break;
                    }
                }
            }

            const customDatasetJobs = trainingJobs.filter((job) => job.job_type !== 'train' && job.owner === req.user.developer_org);

            res.render('dev_nlp_models', {
                page_title: req._("Almond Developer Console - Models"),
                models, templatePacks, customDatasetJobs,
                defaultModelConfig: DEFAULT_TRAINING_CONFIG,
                defaultCustomDatasetConfig: DEFAULT_CUSTOM_DATASET_CONFIG,
                trainPublicCost: creditSystem.TRAIN_LUINET_PUBLIC_COST,
                trainPrivateCost: creditSystem.TRAIN_LUINET_PRIVATE_COST,
            });
        }).catch(next);
    });
}

if (Config.WITH_THINGPEDIA === 'embedded') {
    router.get('/devices', user.requireLogIn, user.requireDeveloper(), (req, res, next) => {
        db.withClient((dbClient) => {
            return device.getByOwner(dbClient, req.user.developer_org);
        }).then((developer_devices) => {
            res.render('dev_devices', { page_title: req._("Almond Developer Console - Devices"),
                                        developer_devices });
        }).catch(next);
    });
}

module.exports = router;
