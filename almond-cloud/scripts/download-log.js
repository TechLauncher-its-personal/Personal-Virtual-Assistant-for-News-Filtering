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
// Author: Silei Xu <silei@cs.stanford.edu>
//         Giovanni Campagna <gcampagn@cs.stanford.edu>
"use strict";

const fs = require('fs');

const db = require('../util/db');
const StreamUtils = require('../util/stream-utils');

module.exports = {
    initArgparse(subparsers) {
        const parser = subparsers.add_parser('download-log', {
            add_help: true,
            description: 'Download utterance log'
        });
        parser.add_argument('-l', '--language', {
            required: true,
        });
        parser.add_argument('-o', '--output', {
            required: true,
            type: fs.createWriteStream,
            help: 'Output path',
        });
    },

    async main(argv) {
        const language = argv.language;

        const [dbClient, dbDone] = await db.connect();

        let query = `select id,preprocessed,target_code,time from utterance_log
                where language = ? order by id asc`;
        query = dbClient.query(query, [language]);

        query.on('result', (row) => {
            argv.output.write(row.id + '\t' + row.preprocessed + '\t' + row.target_code + '\t' + row.time.toISOString() + '\n');
        });
        query.on('end', () => {
            argv.output.end();
            dbDone();
        });
        query.on('error', (e) => { throw e; });

        await StreamUtils.waitFinish(argv.output);
        await db.tearDown();
    }
};
