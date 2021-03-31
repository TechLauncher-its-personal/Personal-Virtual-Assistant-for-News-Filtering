// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2016-2018 The Board of Trustees of the Leland Stanford Junior University
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

const user = require('../model/user');
const db = require('../util/db');
const EngineManager = require('../almond/enginemanagerclient');

var router = express.Router();

router.post('/:user_id/:id', (req, res, next) => {
    db.withClient((dbClient) => {
       return user.getIdByCloudId(dbClient, req.params.user_id);
    }).then((user) => {
       return EngineManager.get().dispatchWebhook(user.id, req, res);
    }, (e) => {
       res.status(400).json({error:'Invalid user'});
    }).catch(next);
});

router.get('/:user_id/:id', (req, res, next) => {
    db.withClient((dbClient) => {
       return user.getIdByCloudId(dbClient, req.params.user_id);
    }).then((user) => {
       return EngineManager.get().dispatchWebhook(user.id, req, res);
    }, (e) => {
       res.status(400).json({error:'Invalid user'});
    }).catch(next);
});

module.exports = router;
