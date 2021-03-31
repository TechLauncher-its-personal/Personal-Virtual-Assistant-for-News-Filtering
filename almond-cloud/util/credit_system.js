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

const assert = require('assert');

const orgModel = require('../model/organization');
const { ForbiddenError } = require('../util/errors');

module.exports = {
    CREATE_MODEL_COST: 50,
    TRAIN_THINGPEDIA_COST: 20,
    TRAIN_LUINET_PUBLIC_COST: 100,
    TRAIN_LUINET_PRIVATE_COST: 500,
    CREATE_MTURK_BATCH_COST: 5,
    RUN_MTURK_BATCH_COST: 10,
    GENERATE_CUSTOM_DATASET_COST: 20,

    WEEKLY_THINGPEDIA_UPDATE: 10,
    WEEKLY_OSS_THINGPEDIA_UPDATE: 50,
    WEEKLY_APPROVED_THINGPEDIA_UPDATE: 100,
    WEEKLY_OSS_TEMPLATE_PACK_UPDATE: 100,

    async payCredits(dbClient, req, orgId, cost) {
        assert(cost !== undefined);

        // check this so we can change the numbers without changing the calling code
        if (cost === 0)
            return;

        const credits = await orgModel.getCredits(dbClient, orgId);
        if (!(credits >= cost)) {
            throw new ForbiddenError(req.ngettext(
                "You do not have enough credits to complete this operation, you need at least %d.",
                "You do not have enough credits to complete this operation, you need at least %d.", cost)
                .format(cost));
        }
        await orgModel.updateCredits(dbClient, orgId, -cost);
    },

    getCreditUpdate(stats) {
        let update = 0;

        update += this.WEEKLY_APPROVED_THINGPEDIA_UPDATE * stats.approved_device_count;

        const non_approved_oss_devices = stats.oss_device_count - stats.oss_approved_device_count;
        update += this.WEEKLY_OSS_THINGPEDIA_UPDATE * non_approved_oss_devices;

        const non_approved_non_oss_devices = stats.device_count - stats.approved_device_count - non_approved_oss_devices;
        update += this.WEEKLY_THINGPEDIA_UPDATE * non_approved_non_oss_devices;

        update += this.WEEKLY_OSS_TEMPLATE_PACK_UPDATE * stats.oss_template_file_count;

        return update;
    },

    getNextUpdate(lastUpdate) {
        const oneWeek = 1000 * 7 * 24 * 3600;

        // each org receives one credit update per week, based on the time of the last update
        // updates are applied in batches daily at midnight UTC, so we round up to the next update time
        const nextUpdate = new Date((+lastUpdate) + oneWeek);
        nextUpdate.setUTCHours(0, 0, 0);
        nextUpdate.setUTCDate(nextUpdate.getUTCDate() + 1);
        return nextUpdate;
    }
};
