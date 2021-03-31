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

const Config = require('../config');

// If you change this file, you must also change model/user.js:getAllForShardId
module.exports = function userToShardId(userId) {
    const nShards = Config.THINGENGINE_MANAGER_ADDRESS.length;

    // this sharding is not perfect (it can cause the number of developer
    // users to be unbalanced), but it is close enough and it is simple
    // to implement
    // if that turns out to be a problem, we can switch to shard based
    // on cloud_id, which is a guaranteed unique number
    return userId % nShards;
};
