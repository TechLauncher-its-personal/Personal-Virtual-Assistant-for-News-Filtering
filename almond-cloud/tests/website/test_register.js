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

const assert = require('assert');
const fs = require('fs');
const { assertHttpError, assertBanner, assertLoginRequired, sessionRequest, dbQuery } = require('./scaffold');
const { startSession } = require('../login');
const minidom = require('../util/minidom');

const db = require('../../util/db');
const EngineManagerClient = require('../../almond/enginemanagerclient');

async function testRegister(charlie) {
    await assertHttpError(sessionRequest('/user/register', 'POST', {}, charlie),
        400, 'Missing or invalid parameter username');

    await assertHttpError(sessionRequest('/user/register', 'POST', { username: { foo: 'bar' } }, charlie),
        400, 'Missing or invalid parameter username');

    await assertHttpError(sessionRequest('/user/register', 'POST', { username: 'charlie' }, charlie),
        400, 'Missing or invalid parameter email');

    await assertHttpError(sessionRequest('/user/register', 'POST', { username: 'charlie', email: 'foo' }, charlie),
        400, 'Missing or invalid parameter password');

    await assertHttpError(sessionRequest('/user/register', 'POST', { username: 'charlie', email: ['foo', 'bar'] }, charlie),
        400, 'Missing or invalid parameter email');

    await assertHttpError(sessionRequest('/user/register', 'POST', { username: 'charlie', email: 'foo', password: 'lol', 'confirm-password': 'lol' }, charlie),
        400, 'Missing or invalid parameter locale');

    await assertBanner(sessionRequest('/user/register', 'POST', {
        username: 'charlie',
        email: 'foo',
        password: 'lol',
        'confirm-password': 'lol',
        locale: 'en-US',
        timezone: 'America/Los_Angeles'
    }, charlie), 'You must specify a valid email.');

    await assertBanner(sessionRequest('/user/register', 'POST', {
        username: 'charlie',
        email: 'foo@bar',
        password: 'lol',
        'confirm-password': 'lol',
        locale: 'en-US',
        timezone: 'America/Los_Angeles'
    }, charlie), 'You must specifiy a valid password, of at least 8 characters.');

    await assertBanner(sessionRequest('/user/register', 'POST', {
        username: 'charlie',
        email: 'foo@bar',
        password: '12345678',
        'confirm-password': 'lol',
        locale: 'en-US',
        timezone: 'America/Los_Angeles'
    }, charlie), 'The password and the confirmation do not match.');

    await assertBanner(sessionRequest('/user/register', 'POST', {
        username: 'charlie',
        email: 'foo1@bar',
        password: '12345678',
        'confirm-password': '12345678',
        locale: 'en-US',
        timezone: 'Foo/Bar'
    }, charlie), 'Invalid localization data.');

    await assertBanner(sessionRequest('/user/register', 'POST', {
        username: 'bob', // <- NOTE
        email: 'foo@bar',
        password: '12345678',
        'confirm-password': '12345678',
        locale: 'en-US',
        timezone: 'America/Los_Angeles'
    }, charlie), 'A user with this name already exists.');

    await sessionRequest('/user/register', 'POST', {
        username: 'charlie',
        email: 'foo@bar',
        password: '12345678',
        'confirm-password': '12345678',
        locale: 'en-US',
        timezone: 'America/Los_Angeles'
    }, charlie);

    // check that now we're registered
    const result = minidom.parse(await sessionRequest('/user/profile', 'GET', null, charlie));

    let found = false;
    for (let el of minidom.getElementsByTagName(result, 'input')) {
        if (minidom.getAttribute(el, 'id') === 'username') {
            assert.strictEqual(minidom.getAttribute(el, 'value'), 'charlie');
            found = true;
        }
    }
    assert(found);
}

async function testDeleteUser(charlie, nobody) {
    const [charlieInfo] = await dbQuery(`select * from users where username = ?`, ['charlie']);
    assert(charlieInfo);
    assert(fs.existsSync('./' + charlieInfo.cloud_id));
    assert(await EngineManagerClient.get().isRunning(charlieInfo.id));
    assert(await EngineManagerClient.get().getEngine(charlieInfo.id));

    await assertLoginRequired(sessionRequest('/user/delete', 'POST', {}, nobody));

    await sessionRequest('/user/delete', 'POST', {}, charlie);

    // check that the user is gone from the database
    const users = await dbQuery(`select * from users where username = ?`, ['charlie']);
    assert.strictEqual(users.length, 0);

    // check that the user is not running any more
    assert(!await EngineManagerClient.get().isRunning(charlieInfo.id));
    await assert.rejects(() => EngineManagerClient.get().getEngine(charlieInfo.id));
    assert(!fs.existsSync('./' + charlieInfo.cloud_id));
}


async function main() {
    const emc = new EngineManagerClient();
    await emc.start();

    const nobody = await startSession();
    const charlie = await startSession();

    await testRegister(charlie);
    await testDeleteUser(charlie, nobody);

    await db.tearDown();
    await emc.stop();
}
module.exports = main;
if (!module.parent)
    main();
