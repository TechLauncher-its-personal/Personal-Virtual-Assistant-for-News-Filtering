// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2018-2019 The Board of Trustees of the Leland Stanford Junior University
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
"use strict";

// All pages that are "website" (marketing, research, projects, team, Terms of Service, about...)
// go here
// Pages can be enabled or disabled from the configuration

const express = require('express');

const Config = require('../config');
const db = require('../util/db');
const deviceModel = require('../model/device');
const blogModel = require('../model/blog');

let router = express.Router();

router.get('/', (req, res, next) => {
    db.withClient(async (dbClient) => {
        const featuredDevices = await deviceModel.getFeatured(dbClient);
        const news = await blogModel.getHomePage(dbClient);
        res.render(Config.ABOUT_OVERRIDE['index'] || 'about_index', {
            page_title: req._('Almond'),
            csrfToken: req.csrfToken(),
            featuredDevices,
            news
        });
    }).catch(next);
});
router.get('/about', (req, res) => {
    res.redirect(301, '/');
});

for (let page of Config.EXTRA_ABOUT_PAGES) {
    router.get('/about/' + page.url, (req, res, next) => {
        res.render(page.view, {
            page_title: req._(page.title)
        });
    });
}

// terms of service is always enabled
router.get('/about/tos', (req, res, next) => {
    res.render(Config.ABOUT_OVERRIDE['tos'] || 'about_tos', {
        page_title: req._("Terms of Service for Almond & Thingpedia")
    });
});

// old mispelling (mix of Terms & Condition and Terms of Service)
// that made it in some OAuth authorization pages so we can't get rid of
router.get('/about/toc', (req, res, next) => {
    res.redirect(301, '/about/tos');
});

// privacy policy is always enabled
router.get('/about/privacy', (req, res, next) => {
    res.render(Config.ABOUT_OVERRIDE['privacy'] || 'about_privacy', {
        page_title: req._("Almond Privacy Policy")
    });
});

module.exports = router;
