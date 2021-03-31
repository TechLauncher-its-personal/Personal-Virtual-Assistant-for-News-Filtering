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

const fs = require("fs");
const path = require('path');
const Genie = require('genie-toolkit');
const Tp = require('thingpedia');

const BaseThingpediaClient = require('../util/thingpedia-client');
const AbstractFS = require('../util/abstract_fs');
const localfs = require('../util/local_fs');

const Config = require('../config');
const kfInferenceUrl = require('../util/kf_inference_url');

// A ThingpediaClient that operates under the credentials of a specific organization
class OrgThingpediaClient extends BaseThingpediaClient {
    constructor(locale, org) {
        super(null, locale);
        this._org = org;
    }

    async _getOrg() {
        return this._org;
    }
}

class DummyExactMatcher {
    async load() {}

    get() {
        return null;
    }

    add() {}
}

class DummyPreferences {
    keys() {
        return [];
    }

    get(key) {
        return undefined;
    }

    set(key, value) {}
}

/**
 * A stubbed-out Tp.BasePlatform implementation to be able to use Tp.HttpClient.
 */
class DummyPlatform extends Tp.BasePlatform {
    constructor(locale) {
        super();
        this._locale = locale;
        this._prefs = new DummyPreferences;
    }

    get locale() {
        return this._locale;
    }

    get type() {
        return 'dummy';
    }

    get timezone() {
        return 'UTC';
    }

    getDeveloperKey() {
        return Config.NL_THINGPEDIA_DEVELOPER_KEY;
    }

    getSharedPreferences() {
        return this._prefs;
    }

    hasCapability() {
        return false;
    }

    getCapability() {
        return null;
    }

    getTmpDir() {
        return localfs.getTmpDir();
    }

    getCacheDir() {
        return localfs.getCacheDir();
    }

    getWritableDir() {
        return localfs.getWritableDir();
    }
}

const nprocesses = 1;

module.exports = class NLPModel {
    constructor(spec, service) {
        this.id = `@${spec.tag}/${spec.language}`;
        this._kfUrl = null;
        if (Config.USE_KF_INFERENCE_SERVICE) {
            const namespace = fs.readFileSync('/var/run/secrets/kubernetes.io/serviceaccount/namespace', 'utf-8');
            this._kfUrl = kfInferenceUrl(this.id, namespace);
        }

        this._localdir = null;
        this.init(spec, service);
    }

    init(spec, service) {
        this.accessToken = spec.access_token;
        this.tag = spec.tag;
        this.locale = spec.language;
        this.trained = spec.trained;
        this.contextual = spec.contextual;

        if (spec.use_exact)
            this.exact = service.getExact(spec.language);
        else
            this.exact = new DummyExactMatcher(); // non default models don't get any exact match

        let modeldir;
        // for compat with unversioned models, if the version is 0 (pre-versioning PR) we don't
        // add the version suffix to the model name
        if (spec.version === 0)
            modeldir = `./${spec.tag}:${spec.language}`;
        else
            modeldir = `./${spec.tag}:${spec.language}-v${spec.version}`;

        this._modeldir = AbstractFS.resolve(Config.NL_MODEL_DIR, modeldir);
        this._platform = new DummyPlatform(spec.language);

        if (Config.WITH_THINGPEDIA === 'embedded') {
            const org = (spec.owner === null || spec.owner === 1) ? { is_admin: true, id: 1 } : { is_admin: false, id: spec.owner };
            this.tpClient = new OrgThingpediaClient(spec.language, org);
        } else {
            this.tpClient = new Tp.HttpClient(this._platform, Config.THINGPEDIA_URL);
        }
    }

    async _download() {
        this._localdir = await AbstractFS.download(this._modeldir + '/');
    }

    async destroy() {
        return Promise.all([
            this.predictor.stop(),
            AbstractFS.removeTemporary(this._localdir)
        ]);
    }

    async reload() {
        if (!this.trained)
            return;

        if (Config.USE_KF_INFERENCE_SERVICE)
            return;

        const oldlocaldir = this._localdir;
        await this._download();

        const oldpredictor = this.predictor;
        this.predictor = Genie.ParserClient.get('file://' + path.resolve(this._localdir), this.locale, this._platform,
            this.exact, this.tpClient, { id: this.id, nprocesses });
        await this.predictor.start();

        await Promise.all([
            oldpredictor ? oldpredictor.stop() : Promise.resolve(),
            oldlocaldir ? AbstractFS.removeTemporary(oldlocaldir) : Promise.resolve()
        ]);
    }

    async load() {
        if (!this.trained)
            return;
        let url = null;
        if (Config.USE_KF_INFERENCE_SERVICE) {
            url = 'kf+' + this._kfUrl;
            console.log('Using KF Inference service: ' + url);
        } else {
            await this._download();
            url = 'file://' + path.resolve(this._localdir);
        }
        this.predictor = Genie.ParserClient.get(url, this.locale, this._platform,
            this.exact, this.tpClient, { id: this.id, nprocesses });
        await this.predictor.start();
    }
};
