// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2018 Google LLC
//           2018-2019 The Board of Trustees of the Leland Stanford Junior University
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

const { tokenize, rejoin, stripUnsafeTokens } = require('../../util/tokenize');

function testTokenize() {
    assert.deepStrictEqual(tokenize('a b c'), ['a', 'b', 'c']);
    assert.deepStrictEqual(tokenize('a, b c'), ['a', ',', 'b', 'c']);
    assert.deepStrictEqual(tokenize('a,b c'), ['a', ',', 'b', 'c']);
    assert.deepStrictEqual(tokenize('a!b c'), ['a', '!', 'b', 'c']);
    assert.deepStrictEqual(tokenize('a!b-c'), ['a', '!', 'b-c']);
    assert.deepStrictEqual(tokenize('a!'), ['a', '!']);
    assert.deepStrictEqual(tokenize('a-b-c'), ['a-b-c']);
    assert.deepStrictEqual(tokenize('a_b_c'), ['a_b_c']);
    assert.deepStrictEqual(tokenize('A B C'), ['a', 'b', 'c']);
}

function testRejoin() {
    assert.strictEqual(rejoin(['a', 'b', 'c']), 'a b c');
    assert.strictEqual(rejoin(['a', '', 'c']), 'a  c');
    assert.strictEqual(rejoin(['', 'b', 'c']), ' b c');
}

function testStripUnsafeTokens() {
    assert.deepStrictEqual(stripUnsafeTokens(['a', 'b', 'c']), ['a', 'b', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', 'b', '?']), ['a', 'b']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '?', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '.', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '*', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '+', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '\\', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '\\b', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', 'b\\', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', '?b', 'c']), ['a', 'c']);
    assert.deepStrictEqual(stripUnsafeTokens(['a', 'b?', 'c']), ['a', 'c']);
}

function main() {
    testTokenize();
    testRejoin();
    testStripUnsafeTokens();
}
module.exports = main;
if (!module.parent)
    main();
