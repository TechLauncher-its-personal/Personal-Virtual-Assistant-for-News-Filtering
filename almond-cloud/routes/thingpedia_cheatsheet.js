// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2017-2019 The Board of Trustees of the Leland Stanford Junior University
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

const DatasetUtils = require('../util/dataset');
const I18n = require('../util/i18n');
const tokenize = require('../util/tokenize');
const iv = require('../util/input_validation');

const Config = require('../config');

var router = express.Router();

router.get('/', iv.validateGET({ platform: '?string' }), (req, res, next) => {
    const language = req.user ? I18n.localeToLanguage(req.user.locale) : 'en';

    DatasetUtils.getCheatsheet(language, { forPlatform: req.query.platform }).then((devices) => {
        res.render('thingpedia_cheatsheet', { page_title: req._("Thingpedia - Supported Operations"),
                                              CDN_HOST: Config.CDN_HOST,
                                              csrfToken: req.csrfToken(),
                                              devices: devices,
                                              clean: tokenize.clean });
    }).catch(next);
});

module.exports = router;
