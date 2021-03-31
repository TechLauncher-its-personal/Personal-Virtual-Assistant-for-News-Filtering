// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2020 The Board of Trustees of the Leland Stanford Junior University
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
const path = require('path');
const Stream = require('stream');
const seedrandom = require('seedrandom');
const csvstringify = require('csv-stringify');

const ThingTalk = require('thingtalk');
const Genie = require('genie-toolkit');

const BaseThingpediaClient = require('../../util/thingpedia-client');
const { parseFlags } = require('../../util/genie_flag_utils');
const StreamUtils = require('../../util/stream-utils');
const genSynthetic = require('../sandboxed_synthetic_gen');
const DatabaseParameterProvider = require('./param_provider');
const { parseConstant, parseConstantFile } = require('./constant-file');

const schemaModel = require('../../model/schema');
const orgModel = require('../../model/organization');
const db = require('../../util/db');
const { coin } = require('../../util/random');

const MAX_SPAN_LENGTH = 10;

class QueryReadableAdapter extends Stream.Readable {
    constructor(query, options) {
        super({ objectMode: true });

        query.on('result', (row) => {
            row.flags = parseFlags(row.flags);
            // mark a sentence for evaluation only if is exact and not synthetic,
            // which means it comes from the online dataset (developer data)

            if (row.flags.exact && !row.flags.synthetic && coin(options.evalProbability, options.rng))
                row.flags.eval = true;
            else
                row.flags.eval = false;
            row.flags.contextual = row.context !== null;
            this.push(row);
        });
        query.on('end', () => {
            this.push(null);
        });
        query.on('error', (e) => {
            this.emit('error', e);
        });
    }

    _read() {}
}

class TypecheckStream extends Stream.Transform {
    constructor(tpClient, schemas) {
        super({ objectMode: true });

        this._tpClient = tpClient;
        this._schemas = schemas;
        this._dropped = 0;
    }

    async process(ex) {
        if (ex.flags.synthetic) {
            // skip typechecking synthetic examples, we know they are correct
            this.push(ex);
            return;
        }

        try {
            const entities = Genie.EntityUtils.makeDummyEntities(ex.preprocessed);
            await Genie.ThingTalkUtils.parsePrediction(ex.target_code.split(' '), entities, {
                thingpediaClient: this._tpClient,
                schemaRetriever: this._schemas
            }, true);
            this.push(ex);
            return;
        } catch(e) {
            this._dropped++;
        }
    }

    _transform(ex, encoding, callback) {
        this.process(ex).then(() => callback(), callback);
    }

    _flush(callback) {
        if (this._dropped > 0)
            console.error(`WARNING: dropped ${this._dropped} sentences after typechecking`);
        callback();
    }
}

class Counter extends Stream.Transform {
    constructor() {
        super({ objectMode: true });
        this._count = 0;
    }

    get count() {
        return this._count;
    }

    _transform(ex, encoding, callback) {
        this._count++;
        callback(null, ex);
    }

    _flush(callback) {
        callback();
    }
}

class OrgThingpediaClient extends BaseThingpediaClient {
    constructor(locale, dbClient, org) {
        super(null, locale, undefined, dbClient);
        this._org = org;
    }

    async _getOrg(dbClient) {
        return this._org;
    }
}

module.exports = class DatasetGenerator {
    constructor(task, forDevices, options) {
        this._task = task;

        // compute the pipeline based on the task name
        this._shouldDoAugmentation = true;
        if (this._task.name === 'gen-custom-synthetic' || this._task.name === 'gen-custom-turking')
            this._shouldDoAugmentation = false;
        this._shouldDownloadParaphrase = false;
        if (this._task.name === 'prepare-training-set' || this._task.name === 'gen-custom-augmented')
            this._shouldDownloadParaphrase = true;

        this._shouldSplitTrainEval = false;
        this._shouldComputeSize = true;
        this._shouldSampleForTurking = false;

        if (this._task.name === 'prepare-training-set') {
            this._shouldSplitTrainEval = true;
            this._shouldComputeSize = false;
        } else if (this._task.name === 'gen-custom-turking') {
            this._shouldSampleForTurking = true;
        }

        this._language = task.language;

        this._locale = this._language;
        if (this._locale === 'en') {
            // HACK we must pass "en-US" otherwise Genie will load the wrong i18n module
            // and sentence post-processing + detokenization will be wrong
            this._locale = 'en-US';
        }

        this._options = options;
        this._contextual = options.contextual;

        this._rng = seedrandom.alea('almond is awesome');

        if (forDevices.length === 0)
            forDevices = null;
        this._forDevices = forDevices;
        this._forAllDevices = forDevices === null;

        this._dbClient = null;
        this._tpClient = null;
        this._schemas = null;
        this._augmenter = null;
    }

    _downloadParaphrase(contextual) {
        const queryString = `select id,flags,preprocessed,context,target_code from example_utterances
            use index (language_flags) where language = ?
            and find_in_set('training',flags) and not find_in_set('obsolete',flags)
            and target_code<>'' and preprocessed<>'' and type <> 'generated'
            ${contextual ? ' and context is not null' : ' and context is null'}
            ${this._forDevicesPattern !== null ? ' and target_code rlike ?' : ''}
            order by id`;

        const query = this._dbClient.query(queryString, [this._language, this._forDevicesPattern]);
        return new QueryReadableAdapter(query, {
            evalProbability: this._options.evalProbability,
            rng: this._rng
        });
    }

    async _transaction() {
        let org;
        if (this._options.approvedOnly) {
            org = null;

            const approvedKinds = (await schemaModel.getAllApproved(this._dbClient, null)).map((d) => d.kind);
            if (this._forDevices === null) {
                this._forDevices = approvedKinds;
            } else {
                const set = new Set(approvedKinds);
                this._forDevices = this._forDevices.filter((k) => set.has(k));
            }
        } else {
            org = await orgModel.get(this._dbClient, this._options.owner);
        }

        if (this._forDevices !== null && this._forDevices.length > 0) {
            const escapedDevices = this._forDevices.map((d) => d.replace(/[.\\]/g, '\\$&')).join('|');
            const pat1 = ' @(' + escapedDevices + ')\\.[A-Za-z0-9_]+( |$)';
            const pat2 = ' device:(' + escapedDevices + ')( |$)';

            this._forDevicesPattern = '(' + pat1 + '|' + pat2 + ')';
            console.log(this._forDevicesPattern);
            this._forDevicesRegexp = new RegExp(this._forDevicesPattern);
        } else {
            this._forDevicesPattern = null;
            this._forDevicesRegexp = null;
        }

        this._tpClient = new OrgThingpediaClient(this._language, this._dbClient, org);
        this._schemas = new ThingTalk.SchemaRetriever(this._tpClient, null, !this._options.debug);

        let constProvider;
        if (this._shouldDoAugmentation || this._shouldSampleForTurking)
            constProvider = new DatabaseParameterProvider(this._language, this._dbClient);

        let constants;
        if (this._shouldSampleForTurking) {
            // XXX we might want to let people supply the constant file, in some way
            // or maybe not: if people want to go crazy, they should download the synthetic only
            // and run genie locally...

            // FIXME this is very hacky, and also English-specific...
            const constantFile = path.resolve(path.dirname(module.filename), '../../node_modules/genie-toolkit/data/en-US/constants.tsv');

            constants = await parseConstantFile(this._locale, constantFile);

            // XXX loading all devices like this is suboptimal...
            const forDevices = this._forDevices || (await schemaModel.getAllApproved(this._dbClient, this._options.owner)).map((d) => d.kind);
            assert(forDevices.length > 0);
            const constSampler = new Genie.MTurk.ConstantsSampler(this._schemas, constProvider, {
                rng: this._rng,
                locale: this._locale,

                devices: forDevices.join(','),
                sample_size: this._options.turkingConstantSampleSize,
            });
            for (let [key, value, display] of await constSampler.sample()) {
                // HACK it would be nice to avoid this parsing step...
                if (!constants[key])
                    constants[key] = [];
                constants[key] = parseConstant(this._language, key, value, display);
            }
        }

        const tmpDir = await genSynthetic.prepare({
            dbClient: this._dbClient,
            language: this._language,
            orgId: this._options.approvedOnly ? null : await this._tpClient._getOrgId(),
            forDevices: this._forAllDevices ? null : this._forDevices,
            templatePack: this._options.templatePack,
        });

        // FIXME find a better place for this
        let basicFlags = this._options.flags.slice();
        if (this._contextual)
            basicFlags.push('no_contextual_bookkeeping');

        const synthetic = genSynthetic.generate(tmpDir, {
            contextual: false,
            language: this._language,
            flags: basicFlags,
            maxDepth: this._options.maxDepth,
            targetPruningSize: this._options.targetPruningSize,
            debug: this._options.debug,
        });

        let paraphrase;
        if (this._shouldDownloadParaphrase) {
            paraphrase = this._downloadParaphrase(false)
                .pipe(new TypecheckStream(this._tpClient, this._schemas));
        }
        let source;
        // assume that the progress of synthetic generation is the overall progress, because
        // synthetic generation is the biggest part of the process, and augmentation happens in parallel
        synthetic.on('progress', (value) => {
            // synthetic generation can complete before the last minibatch of augmentation is done
            // but we don't want to show 100% progress in that case, so cap the progress at 99%
            value *= 0.99;
            this._task.setProgress(value).catch((e) => {
                console.error(`Failed to update task progress: ${e.message}`);
            });
        });

        if (this._shouldDownloadParaphrase)
            source = StreamUtils.chain([paraphrase, synthetic], { objectMode: true });
        else
            source = synthetic;

        let dataset;
        if (this._shouldDoAugmentation) {
            const augmenter = new Genie.DatasetAugmenter(this._schemas, constProvider, this._tpClient, {
                quotedProbability: this._options.quotedProbability,
                untypedStringProbability: 0,
                maxSpanLength: MAX_SPAN_LENGTH,
                syntheticExpandFactor: 1,
                paraphrasingExpandFactor: 30,
                noQuoteExpandFactor: 10,
                singleDeviceExpandFactor: 3,

                locale: this._locale,
                paramLocale: this._locale,
                rng: this._rng,
                debug: this._options.debug,
            });
            dataset = source.pipe(augmenter);
        } else {
            dataset = source;
        }

        let counter;
        if (this._shouldComputeSize) {
            counter = new Counter();
            dataset = dataset.pipe(counter);
        }

        if (this._shouldSplitTrainEval) {
            const train = new Genie.DatasetStringifier();
            const eval_ = new Genie.DatasetStringifier();
            const promises = [];
            promises.push(StreamUtils.waitFinish(train.pipe(this._options.train)));
            promises.push(StreamUtils.waitFinish(eval_.pipe(this._options.eval)));

            const splitter = new Genie.DatasetSplitter({
                rng: this._rng,
                locale: this._language,

                train,
                eval: eval_,

                // we use this._options.evalProbability to set the "eval" flag,
                // but all sentences with the eval flag should go in the eval set
                evalProbability: 1.0,
                forDevices: this._forDevices,
                splitStrategy: this._options.splitStrategy,
                useEvalFlag: true
            });
            dataset.pipe(splitter);

            await Promise.all(promises);
        } else if (this._shouldSampleForTurking) {
            const sampler = new Genie.MTurk.SentenceSampler(this._tpClient, this._schemas, constants, {
                rng: this._rng,
                locale: this._language,

                samplingStrategy: this._options.turkingSamplingStrategy,
                functionBlackList: this._options.turkingFunctionBlackList,
                functionHighValueList: this._options.turkingFunctionHighValueList,
                functionWhiteList: this._options.turkingFunctionWhiteList,

                compoundOnly: this._options.turkingCompoundOnly,

                debug: this._options.debug
            });

            await StreamUtils.waitFinish(dataset
                .pipe(sampler)
                .pipe(csvstringify({ header: true, delimiter: '\t' }))
                .pipe(this._options.output));
        } else {
            await StreamUtils.waitFinish(dataset
                .pipe(new Genie.DatasetStringifier())
                .pipe(this._options.output));
        }

        if (this._shouldComputeSize) {
            await this._task.setMetrics({
                dataset_size: counter.count
            });
        }

        await this._task.setProgress(1.0).catch((e) => {
            console.error(`Failed to update task progress: ${e.message}`);
        });
    }

    async run() {
        await db.withTransaction(async (dbClient) => {
            this._dbClient = dbClient;

            const timeout = setInterval(() => {
                this._dbClient.ping((err) => {
                    if (err)
                        console.error(`Ignored error in PING to database: ` + err.message);
                });
            }, 60000);

            try {
                await this._transaction();
            } finally {
                clearInterval(timeout);
            }
        }, 'repeatable read', 'read only');
    }
};
