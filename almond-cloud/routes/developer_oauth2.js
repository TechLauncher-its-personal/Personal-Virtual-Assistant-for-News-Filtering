// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2019 The Board of Trustees of the Leland Stanford Junior University
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

const Url = require('url');
const express = require('express');
const multer = require('multer');
const csurf = require('csurf');
const util = require('util');
const fs = require('fs');
const os = require('os');

const model = require('../model/oauth2');
const user = require('../util/user');
const db = require('../util/db');
const code_storage = require('../util/code_storage');
const graphics = require('../almond/graphics');
const iv = require('../util/input_validation');
const { BadRequestError, ForbiddenError } = require('../util/errors');
const { makeRandom } = require('../util/random');

var router = express.Router();

async function uploadIcon(clientId, file) {
    try {
        try {
            const image = graphics.createImageFromPath(file.path);
            image.resizeFit(512, 512);
            const [stdout,] = await image.stream('png');
            await code_storage.storeIcon(stdout, 'oauth:' + clientId);
        } finally {
            await util.promisify(fs.unlink)(file.path);
        }
    } catch(e)  {
        console.error('Failed to upload icon to S3: ' + e);
    }
}

function validateScopes(req, allowedScopes) {
    if (!Array.isArray(allowedScopes))
        allowedScopes = [allowedScopes];
    for (let scope of allowedScopes) {
        if (typeof scope !== 'string' || !user.OAuthScopes.has(scope))
            throw new BadRequestError(req._("Invalid scope"));
    }
    return allowedScopes;
}

function validateRedirectUrls(req, urls) {
    for (let url of urls) {
        const parsed = Url.parse(url);
        if (parsed.protocol === null || parsed.hostname === null ||
            (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1'))
            throw new BadRequestError(req._("Invalid redirect URI (must be an absolute https: URL)"));
    }
    return urls;
}

router.post('/create',
    multer({ dest: os.tmpdir() }).single('icon'),
    csurf({ cookie: false }),
    user.requireLogIn, user.requireDeveloper(),
    iv.validatePOST({ scope: ['array', '?string'], name: 'string', redirect_uri: 'string' }), (req, res, next) => {
    const name = req.body.name;
    let scopes, redirectUrls;
    try {
        if (!name)
            throw new BadRequestError(req._("Name must be provided"));
        if (!req.file)
            throw new BadRequestError(req._("Must upload an icon"));
        scopes = validateScopes(req, req.body.scope);

        if (scopes.indexOf('profile') < 0)
            scopes.push('profile');
        scopes.sort();

        if ((req.user.roles & user.Role.ADMIN) === 0 &&
            scopes.indexOf('user-sync') >= 0)
            throw new ForbiddenError(req._("user-sync scope is valid only for administrators"));

        redirectUrls = validateRedirectUrls(req, req.body.redirect_uri.split(/ +/));
    } catch(e) {
        res.status(400).render('error', { page_title: req._("Almond - Error"),
                                          message: e });
        return;
    }

    db.withTransaction(async (dbClient) => {
        const clientId = makeRandom(8);
        const clientSecret = makeRandom();
        await model.createClient(dbClient, {
            id: clientId,
            secret: clientSecret,
            name: name,
            owner: req.user.developer_org,
            allowed_scopes: scopes.join(' '),
            allowed_redirect_uris: JSON.stringify(redirectUrls)
        });

        // upload the icon asynchronously to avoid blocking the request
        uploadIcon(clientId, req.file);
    }).then(() => {
        res.redirect(303, '/developers/oauth');
    }).catch(next);
});

module.exports = router;
