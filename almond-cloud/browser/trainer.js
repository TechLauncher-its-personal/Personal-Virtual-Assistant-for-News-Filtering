// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2016-2020 The Board of Trustees of the Leland Stanford Junior University
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

// This file is meant to be used as an entry point to a browserify
// bundle
// we can use commonjs but no nodejs deps

require('./polyfill');

const ThingTalk = require('thingtalk');
const SchemaRetriever = ThingTalk.SchemaRetriever;

const ParserClient = require('./deps/parserclient');
const ThingpediaClient = require('./deps/thingpediaclient');
const ThingTalkUtils = require('./deps/thingtalkutils');
const reconstructCanonical = require('./deps/reconstruct_canonical');

const Recorder = require('./deps/recorder');

class ThingTalkTrainer {
    constructor() {
        this._locale = document.body.dataset.locale || 'en-US';

        this._parserUrl = document.body.dataset.nlServerUrl;
        this._developerKey = document.body.dataset.developerKey || null;
        this.parser = new ParserClient(this._parserUrl, this._locale, this._developerKey);

        this._user = document.body.dataset.cloudId || null;

        this.thingpedia = new ThingpediaClient(this._developerKey, this._locale);
        this._schemaRetriever = new SchemaRetriever(this.thingpedia);

        this._raw = null;
        this._entities = null;

        this._sttUrl = document.body.dataset.voiceServerUrl + '/rest/stt' || 'http://127.0.0.1:8000/rest/stt';
        this._isRecording = false;
        this._stream = null;
        this._recorder = null;
        this._verbalRaw = null; // store uncorrected transcript for learning

        $('#counter').text(localStorage.getItem('counter') || 0);
        $('#sentence-to-code-form').submit(this._formSubmit.bind(this));
        $('#sentence-to-code-done').click(this._codeDone.bind(this));
        $('#record-button').click(this._startStopRecord.bind(this));
    }

    _postAudio(blob) {
        const data = new FormData();
        data.append('audio', blob);
        $.ajax({
            url: this._sttUrl,
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: (data) => {
                if (data.status === 'ok') {
                    this._verbalRaw = data.text;
                    $('#utterance').val(data.text).focus();
                    $('#record-button').text('Say a command!');
                    this._doHandleUtterance();
                } else {
                    console.log(data);
                    $('#record-button').text('Hmm I couldn\'t understand...');
                }
            },
            error: (error) => {
                console.log(error);
                $('#record-button').text('Hmm there seems to be an error...');
            }
        });
    }

    _startStopRecord(event) {
        event.preventDefault();
        if (!this._isRecording) {
            navigator.mediaDevices.getUserMedia({audio: true, video: false}).then((stream) => {
                // console.log('getUserMedia() success, stream created, initializing Recorder.js...');
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const context = new AudioContext(); 
                const input = context.createMediaStreamSource(stream);
                const rec = new Recorder(input, {numChannels: 1});
                rec.record();

                // console.log('Recording started');
                $('#record-button').text('Recording... Press this to stop');

                this._isRecording = true;
                this._stream = stream;
                this._recorder = rec; 
            }).catch((err) => {
                console.log('getUserMedia() failed');
                console.log(err);
                $('#record-button').text('You don\'t seem to have a recording device enabled!');
                // alert('You don\'t seem to have a recording device enabled!');
            });
        } else {
            $('#record-button').text('Processing command...');
            this._recorder.stop();
            this._stream.getAudioTracks()[0].stop();
            this._recorder.exportWAV((blob) => {
                this._postAudio(blob);
            });
            this._isRecording = false;
        }
    }

    _counter() {
        let v = localStorage.getItem('counter') || 0;
        v++;
        localStorage.setItem('counter', v);
        return v;
    }

    _accept(event) {
        event.preventDefault();

        const a = $(event.currentTarget);
        const code = a.attr('data-target');
        console.log('code', code);

        var editThingTalk = $('#edit-thingtalk')[0].checked;
        if (editThingTalk) {
            $('#thingtalk-editor').removeClass('hidden');
            $('#thingtalk-group').removeClass('has-error');
            $('#thingtalk-error').text('');
            $('#thingtalk').val(code);
        } else {
            $('#thingtalk-editor').addClass('hidden');
            this._learnThingTalk(code).then((data) => {
                $('#results-container').hide();
                if (data.error)
                    console.log('Error in learning', data.error);
                else
                    $('#counter').text(String(this._counter()));
            });
        }
    }

    // we can't train on a fully negative example, so we just do nothing
    // the sentence has been stored in the log anyway
    _rejectAll(event) {
        event.preventDefault();

        var editThingTalk = $('#edit-thingtalk')[0].checked;
        if (editThingTalk) {
            $('#thingtalk-editor').removeClass('hidden');
            $('#thingtalk-group').removeClass('has-error');
            $('#thingtalk-error').text('');
            $('#thingtalk').val('');
        } else {
            $('#results-container').hide();
            $('#counter').text(String(this._counter()));
        }
    }

    _writeCode(event) {
        event.preventDefault();

        $('#thingtalk-editor').removeClass('hidden');
        $('#thingtalk-group').removeClass('has-error');
        $('#thingtalk-error').text('');
        $('#thingtalk').val('');
    }

    _formSubmit(event) {
        event.preventDefault();
        this._doHandleUtterance();
    }

    _doHandleUtterance() {
        this._handle($('#utterance').val()).then((candidates) => {
            $('#results-container').show();
            let results = $('#results');
            results.empty();

            let previous = null;
            let prediction = null;
            for (let candidate of candidates) {
                if (candidate === null)
                    continue;
                if (prediction === null)
                    prediction = candidate;
                if (candidate.canonical === previous)
                    continue;
                previous = candidate.canonical;

                const code = candidate.program.prettyprint().replace(/\n/g, ' ');
                let link = $('<a href="#">')
                    .text(candidate.canonical)
                    .addClass('result')
                    .attr('title', code)
                    .attr('data-target', code)
                    .click(this._accept.bind(this));
                results.append($('<li>').append(link));
            }
            if (prediction === null) {
                $('#prediction').text("Almond is confused and does not know what to do.");
            } else {
                $('#prediction').text(prediction.canonical);

                let link = $('<a href="#">')
                    .text('None of the above')
                    .addClass('result')
                    .click(this._rejectAll.bind(this));
                results.append($('<li>').append(link));
            }

            let link = $('<a href="#">')
                .text('Let me write the ThingTalk code')
                .addClass('result')
                .click(this._writeCode.bind(this));
            results.append($('<li>').append(link));
        });
    }

    _formatError(e) {
        var err;
        if (typeof e === 'string') {
            err = e;
        } else if (e.name === 'SyntaxError') {
            if (e.location)
                err = "Syntax error at line " + e.location.start.line + " column " + e.location.start.column + ": " + e.message;
            else
                err = "Syntax error at " + e.fileName + " line " + e.lineNumber + ": " + e.message;
        } else if (e.message) {
            err = e.message;
        } else {
            err = String(e);
        }
        return err;
    }

    _codeDone(event) {
        event.preventDefault();

        var tt = $('#thingtalk').val();
        Promise.resolve().then(() => {
            return this._learnThingTalk(tt);
        }).then((data) => {
            if (!data)
                return;

            $('#results-container').hide();
            $('#thingtalk-editor').addClass('hidden');
            $('#thingtalk-group').removeClass('has-error');
            $('#thingtalk-error').text('');
            if (data.error)
                console.log('Error in learning', data.error);
            else
                $('#counter').text(String(this._counter()));
        }).catch((e) => {
            $('#thingtalk-group').addClass('has-error');
            $('#thingtalk-error').text(this._formatError(e));
        });
    }

    _learnThingTalk(text) {
        text = text.trim();
        if (!text)
            return Promise.resolve(null);

        const raw = this._raw;
        return ThingTalkUtils.parse(text, this._schemaRetriever).then((program) => {
            this._code = ThingTalkUtils.serializePrediction(program, this._tokens, this._entities);
            return this.parser.onlineLearn(raw, this._code, 'online', this._user);
        });
    }

    _handle(text) {
        return this.parser.sendUtterance(text).then((parsed) => {
            this._raw = text;
            this._tokens = parsed.tokens;
            this._entities = parsed.entities;
            return Promise.all(parsed.candidates.map((candidate) => {
                return ThingTalkUtils.parsePrediction(candidate.code, this._entities, this._schemaRetriever, true).then((program) => {
                    if (program instanceof ThingTalk.Ast.DialogueState) {
                        if (program.dialogueAct !== 'execute')
                            throw new Error(`Not an executable command`);
                        program = new ThingTalk.Ast.Program(null, [], [], [program.history[0].stmt]);
                    }
                    candidate.program = program;
                    candidate.canonical = reconstructCanonical(program);
                    return candidate;
                }).catch((e) => {
                    console.log('Failed to reconstruct canonical for ' + candidate.code + ': ' + e.message);
                    return null;
                });
            }));
        });
    }
}

$(() => {
    new ThingTalkTrainer();
});
