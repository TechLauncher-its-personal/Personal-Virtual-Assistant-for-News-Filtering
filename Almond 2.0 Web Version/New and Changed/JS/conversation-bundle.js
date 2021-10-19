(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
"use strict";

const Recorder = require('./deps/recorder');

$(() => {
    var conversationId = null;
    var url;
    var target = $('#conversation').attr('data-target');
    var isAnonymous = target.startsWith('/me/ws/anonymous');
    function updateUrl() {
        url = (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + target;
        if (conversationId) {
            if (url.indexOf('?') >= 0)
                url += '&id=' + conversationId;
            else
                url += '?id=' + conversationId;
        }
    }
    updateUrl();

    var ws = undefined;
    var open = false;
    var recording = false;

    let _isRecording = false;
    let _stream, _recorder;
    const _sttUrl = document.body.dataset.voiceServerUrl + '/rest/stt' || 'http://127.0.0.1:8000/rest/stt';

    var pastCommandsUp = []; // array accessed by pressing up arrow
    var pastCommandsDown = []; // array accessed by pressing down arrow
    var currCommand = ""; // current command between pastCommandsUp and pastCommandsDown

    var lastMessageId = -1;

    var container = $('#chat');
    var currentGrid = null;

    var CDN_HOST = $('body').attr('data-icon-cdn');

    function refreshToolbar() {
        if (isAnonymous) {
            recording = true;
            return;
        }
        if (conversationId) {
            $('#toolbar').removeClass('hidden');
            $.get('/me/recording/status/' + conversationId).then((res) => {
                if (res.status === 'on') {
                    recording = true;
                    $('#recording-toggle').prop("checked", true);
                } else {
                    recording = false;
                    $('#recording-toggle').prop("checked", false);
                }
            });
            $.get('/me/recording/log/' + conversationId).then((res) => {
                if (res.status === 'ok')
                    $('#show-log').removeClass('hidden');
                else
                    $('#show-log').addClass('hidden');
            });
        } else {
            $('#toolbar').addClass('hidden');
        }
    }
    /*
        function updateConnectionFeedback() {
            if (!ws || !open) {
                $('#input-form-group').addClass('has-warning');
                $('#input-form-group .spinner-container').addClass('hidden'); -
                $('#input-form-group .glyphicon-warning-sign, #input-form-group .help-block').removeClass('hidden');
                return;
            }

            $('#input-form-group').removeClass('has-warning');
            $('#input-form-group .glyphicon-warning-sign, #input-form-group .help-block').addClass('hidden');
        }

        function updateSpinner(thinking) {
            if (!ws || !open)
                return;

            if (thinking)
                $('#input-form-group .spinner-container').removeClass('hidden');
            else
                $('#input-form-group .spinner-container').addClass('hidden');
        }
    */
    function postAudio(blob) {
        const data = new FormData();
        data.append('audio', blob);
        $.ajax({
            url: _sttUrl,
            type: 'POST',
            data: data,
            contentType: false,
            processData: false,
            success: (data) => {
                if (data.status === 'ok') {
                    $('#input').val(data.text).focus();
                    manInputTextCommand('Say a command!', 3);
                    handleUtterance();
                } else {
                    console.log(data);
                    manInputTextCommand('Hmm I couldn\'t understand...', 1);
                    manInputTextCommand('', 5);
                }
            },
            error: (error) => {
                console.log(error);
                manInputTextCommand('Hmm there seems to be an error...', 1);
                manInputTextCommand('', 5);
            }
        });
    }

    function manInputTextCommand(msg, sts) {
        let msgbase = 'Write your command or answer here';

        switch (sts) {
            case 1: // starting record and hide mic
                $('#input').val('');
                $('#input').prop('disabled', true);
                $('#input').addClass('input-alert');
                $('#input').attr('placeholder', msg);
                $('#record-button').addClass('hidden');
                break;
            case 2: // starting record and keep mic
                $('#input').val('');
                $('#input').prop('disabled', true);
                $('#input').addClass('input-alert');
                $('#input').attr('placeholder', msg);
                break;
            case 3: // stop recording and show mic
                $('#input').attr('placeholder', msgbase);
                $('#input').removeClass('input-alert');
                $('#input').prop('disabled', false);
                $('#record-button').removeClass('hidden');
                break;
            case 4: // stop recording and keep mic
                $('#input').attr('placeholder', msgbase);
                $('#input').removeClass('input-alert');
                $('#input').prop('disabled', false);
                break;
            case 5: // show cancel
                $('#record-button').addClass('hidden');
                $('#form-icon').addClass('hidden');
                $('#cancel').removeClass('hidden');
                $('#input').attr('placeholder', msgbase);
                $('#input').removeClass('input-alert');
                $('#input').prop('disabled', false);
                break;
            case 6: // remove cancel
                $('#input').attr('placeholder', msgbase);
                $('#cancel').addClass('hidden');
                $('#input').removeClass('input-alert');
                $('#input').prop('disabled', false);
                break;
            case 7: // show warning
                $('#record-button').addClass('hidden');
                $('#cancel').addClass('hidden');
                $('#input').prop('disabled', true);
                $('#input').attr('placeholder', msg);
                $('#form-icon').removeClass('hidden');
                break;
            case 8: // remove warning
                $('#input').prop('disabled', false);
                $('#input').attr('placeholder', msgbase);
                $('#form-icon').addClass('hidden');
                break;
        }

    }

    function updateConnectionFeedback() {
        if (!ws || !open) {
            //$('#input-form-group').addClass('has-warning');
            manageSpinner('remove');
            manageLostConnectionMsg('add');
            manageLostConnectionMsg('show');
            manInputTextCommand('', 1);
            manInputTextCommand('Not Connected', 7);
            return;
        }

        //$('#input-form-group').removeClass('has-warning');
        $('.alert').addClass('hidden');
        manageLostConnectionMsg('remove');
        manInputTextCommand('', 3);
        manInputTextCommand('', 8);
    }

    function updateSpinner(thinking) {
        if (!ws || !open)
            return;

        let to_do;

        if (thinking)
            to_do = 'show';
        else
            to_do = 'remove';

        manageSpinner(to_do);
    }

    function manageLostConnectionMsg(todo) {
        switch (todo) {
            case 'remove':
                $('#chat > .help-block').remove();
                break;
            case 'show':
                $('#chat > .help-block').removeClass('hidden');
                break;
            case 'add':
                $('#chat > .help-block').remove();
                $('#conversation .hidden-container > .help-block').clone().appendTo('#chat').last();
                break;
        }

    }

    function manageSpinner(todo) {
        let last_elem = $(".from-user").last();
        switch (todo) {
            case 'remove':
                $('#chat > .almond-thinking').remove();
                break;
            case 'show':
                $('#chat > .almond-thinking').remove();
                $(".almond-thinking").clone().insertAfter(last_elem);
                $('#chat > .almond-thinking').removeClass('hidden');
                break;
            case 'showVoice': {
                const lastElement = $(".from-almond").last();
                $('#chat > .almond-thinking').remove();
                $(".almond-thinking").clone().insertAfter(lastElement);
                $('#chat > .almond-thinking').removeClass('hidden');
                break;
            }
        }
    }

    function startStopRecord() {
        if (!_isRecording) {
            navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
                // console.log('getUserMedia() success, stream created, initializing Recorder.js...');
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                const context = new AudioContext();
                const input = context.createMediaStreamSource(stream);
                const rec = new Recorder(input, { numChannels: 1 });
                rec.record();

                // console.log('Recording started');
                manInputTextCommand('Recording... Press again to stop', 2);

                _isRecording = true;
                _stream = stream;
                _recorder = rec;
            }).catch((err) => {
                console.log('getUserMedia() failed');
                console.log(err);
                manInputTextCommand('You don\'t seem to have a recording device enabled!', 1);
                manInputTextCommand('', 5);
                //alert('You don\'t seem to have a recording device enabled!');
            });
        } else {
            manInputTextCommand('Processing command...', 1);
            manInputTextCommand('', 5);
            manageSpinner('showVoice');
            scrollChat();
            _recorder.stop();
            _stream.getAudioTracks()[0].stop();
            _recorder.exportWAV((blob) => {
                postAudio(blob);
            });
            _isRecording = false;
        }
    }

    (function() {
        var reconnectTimeout = 100;

        function connect() {
            ws = new WebSocket(url);
            ws.onmessage = function(event) {
                if (!open) {
                    open = true;
                    reconnectTimeout = 100;
                    updateConnectionFeedback();
                }
                onWebsocketMessage(event);
                refreshToolbar();
            };

            ws.onclose = function() {
                console.error('Web socket closed');
                ws = undefined;
                open = false;
                updateConnectionFeedback();

                // reconnect immediately if the connection previously succeeded, otherwise
                // try again in a little bit
                if (open) {
                    setTimeout(connect, 100);
                } else {
                    reconnectTimeout = 1.5 * reconnectTimeout;
                    setTimeout(connect, reconnectTimeout);
                }
            };
        }

        if (isAnonymous)
            $('#try-almond-now').one('click', () => { connect(); });
        else
            connect();
    })();

    function syncCancelButton(msg) {
        var visible = msg.ask !== null;
        if (visible) {
            manInputTextCommand('', 1);
            manInputTextCommand('', 5);
        } else {
            manInputTextCommand('', 3);
            manInputTextCommand('', 6);
        }
    }

    function almondMessage(icon) {
        var msg = $('<span>').addClass('message-container from-almond');
        icon = icon || 'org.thingpedia.builtin.thingengine.builtin';
        var thingpediaUrl = ThingEngine.getThingpedia();
        var src;
        src = '/assets/images/chat.png';
        //if (thingpediaUrl !== '/thingpedia')
        //    src = thingpediaUrl + '/api/v3/devices/icon/' + icon;
        //else
        //    src = CDN_HOST + '/icons/' + icon + '.png';
        msg.append($('<img>').addClass('icon').attr('src', src));
        container.append(msg);

        if (recording)
            addVoteButtons();

        manageLostConnectionMsg('add');
        manageSpinner('remove');
        scrollChat();
        return msg;
    }

    function addVoteButtons() {
        $('.comment-options').remove();
        $('#comment-block').val('');
        const upvote = $('<i>').addClass('far fa-thumbs-up').attr('id', 'upvoteLast');
        const downvote = $('<i>').addClass('far fa-thumbs-down').attr('id', 'downvoteLast');
        const comment = $('<i>').addClass('far fa-comment-alt').attr('id', 'commentLast')
            .attr('data-toggle', 'modal')
            .attr('data-target', '#comment-popup');
        upvote.click((event) => {
            $.post(isAnonymous ? '/me/recording/anonymous/vote/up' : '/me/recording/vote/up', {
                id: conversationId,
                _csrf: document.body.dataset.csrfToken
            }).then((res) => {
                if (res.status === 'ok') {
                    upvote.attr('class', 'fa fa-thumbs-up');
                    downvote.attr('class', 'far fa-thumbs-down');
                }
            });
            event.preventDefault();
        });
        downvote.click((event) => {
            $.post(isAnonymous ? '/me/recording/anonymous/vote/down' : '/me/recording/vote/down', {
                id: conversationId,
                _csrf: document.body.dataset.csrfToken
            }).then((res) => {
                if (res.status === 'ok') {
                    upvote.attr('class', 'far fa-thumbs-up');
                    downvote.attr('class', 'fa fa-thumbs-down');
                }
            });
            event.preventDefault();
        });
        const div = $('<span>').addClass('comment-options');
        div.append(upvote);
        div.append(downvote);
        div.append(comment);
        container.append(div);
        return div;
    }

    function maybeScroll(container) {
        if (!$('#input:focus').length)
            return;

        scrollChat();
        setTimeout(scrollChat, 1000);
    }

    function scrollChat() {
        let chat = document.getElementById('chat');
        chat.scrollTop = chat.scrollHeight;
        console.log("this scroll");
    }

    function textMessage(text, icon) {
        var container = almondMessage(icon);
        container.append($('<span>').addClass('message message-text')
            .text(text));
        maybeScroll(container);
    }

    function picture(url, icon) {
        var container = almondMessage(icon);
        container.append($('<img>').addClass('message message-picture')
            .attr('src', url));
        maybeScroll(container);
    }

    function rdl(rdl, icon) {
        var container = almondMessage(icon);
        var rdlMessage = $('<a>').addClass('message message-rdl')
            .attr('href', rdl.webCallback).attr("target", "_blank").attr("rel", "noopener nofollow");
        rdlMessage.append($('<span>').addClass('message-rdl-title')
            .text(rdl.displayTitle));
        if (rdl.pictureUrl) {
            rdlMessage.append($('<span>').addClass('message-rdl-content')
                .append($('<img>').attr('src', rdl.pictureUrl)));
        }
        rdlMessage.append($('<span>').addClass('message-rdl-content')
            .text(rdl.displayText));
        container.append(rdlMessage);
        maybeScroll(container);
    }

    function getGrid() {
        if (!currentGrid) {
            var wrapper = $('<div>').addClass('message-container button-grid container');
            currentGrid = $('<div>').addClass('row');
            wrapper.append(currentGrid);
            container.append(wrapper);
        }
        return currentGrid;
    }

    function choice(idx, title) {
        var holder = $('<div>').addClass('col-xs-12 col-sm-6');
        var btn = $('<a>').addClass('message message-choice btn btn-default')
            .attr('href', '#').text(title);
        btn.click((event) => {
            handleChoice(idx, title);
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function buttonMessage(title, json) {
        var holder = $('<div>').addClass('col-xs-12 col-sm-6');
        var btn = $('<a>').addClass('message message-button btn btn-default')
            .attr('href', '#').text(title);
        btn.click((event) => {
            handleParsedCommand(json, title);
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function linkMessage(title, url, state) {
        var holder = $('<div>').addClass('col-xs-12 col-sm-6');

        var btn;
        if (url === '/user/register') {
            btn = $('<button>').addClass('message message-button btn btn-default').text(title).click((event) => {
                event.preventDefault();
                $('#try-almond-registration [name=conversation_state]').val(JSON.stringify(state));
                $('#try-almond-registration').modal();
            });
        } else {
            if (url === '/apps')
                url = '/me';
            else if (url.startsWith('/devices'))
                url = '/me' + url;

            btn = $('<a>').addClass('message message-button btn btn-default')
                .attr('href', url).attr("target", "_blank").attr("rel", "noopener").text(title);
        }
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function yesnoMessage() {
        var holder = $('<div>').addClass('col-xs-6 col-sm-4 col-md-3');
        var btn = $('<a>').addClass('message message-yesno btn btn-default')
            .attr('href', '#').text("Yes");
        btn.click((event) => {
            handleSpecial('yes', "Yes");
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        holder = $('<div>').addClass('col-xs-6 col-sm-4 col-md-3');
        btn = $('<a>').addClass('message message-yesno btn btn-default')
            .attr('href', '#').text("No");
        btn.click((event) => {
            handleSpecial('no', "No");
            event.preventDefault();
        });
        holder.append(btn);
        getGrid().append(holder);
        maybeScroll(holder);
    }

    function collapseButtons() {
        $('.message-button, .message-choice, .message-yesno').remove();
        $('.comment-options').remove();
    }

    function syncKeyboardType(ask) {
        if (ask === 'password')
            $('#input').attr('type', 'password');
        else
            $('#input').attr('type', 'text');
    }

    function onWebsocketMessage(event) {
        var parsed = JSON.parse(event.data);
        console.log('received ' + event.data);

        if (parsed.type === 'id') {
            if (conversationId && conversationId !== parsed.id) {
                // the server changed the conversation ID, reset the last message ID
                lastMessageId = -1;
            }
            conversationId = parsed.id;
            updateUrl();
            if ($('#recording-toggle').is(':checked'))
                startRecording();
            else
                refreshToolbar();
            return;
        }

        if (parsed.type === 'askSpecial') {
            syncKeyboardType(parsed.ask);
            syncCancelButton(parsed);
            if (parsed.ask === 'yesno')
                yesnoMessage();
            updateSpinner(false);
            return;
        }

        if (parsed.id <= lastMessageId)
            return;
        lastMessageId = parsed.id;

        switch (parsed.type) {
        case 'text':
        case 'result':
            // FIXME: support more type of results
            textMessage(parsed.text, parsed.icon);
            currentGrid = null;
            break;

        case 'picture':
            picture(parsed.url, parsed.icon);
            currentGrid = null;
            break;

        case 'rdl':
            rdl(parsed.rdl, parsed.icon);
            currentGrid = null;
            break;

        case 'choice':
            choice(parsed.idx, parsed.title);
            break;

        case 'button':
            buttonMessage(parsed.title, parsed.json);
            break;

        case 'link':
            linkMessage(parsed.title, parsed.url, parsed.state);
            break;

        case 'hypothesis':
            $('#input').val(parsed.hypothesis);
            break;

        case 'command':
            $('#input').val('');
            collapseButtons();
            appendUserMessage(parsed.command);
            break;

        case 'ping':
            handlePing();
            break;
        }
    }

    function handleSlashR(line) {
        line = line.trim();
        if (line.startsWith('{'))
            handleParsedCommand(JSON.parse(line));
        else
            handleParsedCommand({ code: line.split(' '), entities: {} });
    }

    function handleCommand(text) {
        if (text.startsWith('\\r')) {
            handleSlashR(text.substring(3));
            return;
        }
        if (text.startsWith('\\t')) {
            handleThingTalk(text.substring(3));
            return;
        }

        updateSpinner(true);
        ws.send(JSON.stringify({ type: 'command', text: text }));
    }

    function handleParsedCommand(json, title) {
        updateSpinner(true);
        ws.send(JSON.stringify({ type: 'parsed', json: json, title: title }));
    }

    function handleThingTalk(tt) {
        updateSpinner(true);
        ws.send(JSON.stringify({ type: 'tt', code: tt }));
    }

    function handlePing() {
        ws.send(JSON.stringify({ type: 'ping' }));
    }

    function handleChoice(idx, title) {
        handleParsedCommand({ code: ['bookkeeping', 'choice', String(idx)], entities: {} }, title);
    }

    function handleSpecial(special, title) {
        handleParsedCommand({ code: ['bookkeeping', 'special', 'special:' + special], entities: {} }, title);
    }

    function appendUserMessage(text) {
        container.append($('<span>').addClass('message message-text from-user')
            .text(text));

        manageLostConnectionMsg('add');
        manageSpinner('show');
        scrollChat();
    }

    function handleUtterance() {
        var text = $('#input').val();
        if (currCommand !== "")
            pastCommandsUp.push(currCommand);
        if (pastCommandsDown.length !== 0) {
            pastCommandsUp = pastCommandsUp.concat(pastCommandsDown);
            pastCommandsDown = [];
        }
        pastCommandsUp.push(text);

        $('#input').val('');

        handleCommand(text);
    }

    $('#input-form').submit((event) => {
        event.preventDefault();
        handleUtterance();
    });

    $('#cancel').click(() => {
        handleSpecial('nevermind', "Cancel.");
        console.log("clicked cancel");
    });

    $('#try-almond-btn').click(function(event) {
        $(this).hide();
        $('#conversation').collapse('show');
        event.preventDefault();
    });

    $('#input-form').on('keydown', (event) => { // button is pressed
        if (event.keyCode === 38) { // Up
            // removes last item from array pastCommandsUp, displays it as currCommand, adds current input text to pastCommandsDown
            currCommand = pastCommandsUp.pop();
            if ($('#input').val() !== "")
                pastCommandsDown.push($('#input').val());
            $('#input').val(currCommand);
        }

        if (event.keyCode === 40) { // Down
            // removes last item from array pastCommandsDown, displays it as currCommand, adds current input text to pastCommandsUp
            currCommand = pastCommandsDown.pop();
            if ($('#input').val() !== "")
                pastCommandsUp.push($('#input').val());
            $('#input').val(currCommand);
        }
    });

    $('#record-button').click((event) => {
        startStopRecord();
    });

    function startRecording() {
        recording = true;
        $.post('/me/recording/start', {
            id: conversationId,
            _csrf: document.body.dataset.csrfToken
        }).then((res) => {
            if (res.status === 'ok')
                refreshToolbar();
        });
    }

    $('#recording-toggle').click(() => {
        if ($('#recording-toggle').is(':checked')) {
            $.get('me/recording/warned').then((res) => {
                if (res.warned === 'yes')
                    startRecording();
                else
                    $('#recording-warning').modal('toggle');
            });
        } else {
            recording = false;
            $.post('/me/recording/stop', {
                id: conversationId,
                _csrf: document.body.dataset.csrfToken
            });
        }
    });

    $('#confirm-recording').click(() => {
        startRecording();
        $('#recording-warning').modal('toggle');
        $('#recording-toggle').prop('checked', true);
    });

    $('#show-log').click(() => {
        $.get('me/recording/log/' + conversationId).then((res) => {
            if (res.status === 'ok') {
                $('#recording-log').text(res.log);
                $('#recording-save').modal('toggle');
            }
        });
    });

    $('#recording-download').click(() => {
        window.open("me/recording/log/" + conversationId + '.txt', "Almond Conversation Log");
    });

    $('#recording-save-done').click(() => {
        $('#recording-save').modal('toggle');
    });

    $('#recording-warning').on('hidden.bs.modal', () => {
        $('#recording-toggle').prop('checked', false);
    });

    $('#cancel-recording').click(() => {
        $('#recording-toggle').prop('checked', false);
        $('#recording-warning').modal('toggle');
    });

    $('#comment-popup').submit((event) => {
        event.preventDefault();
        $.post(isAnonymous ? '/me/recording/anonymous/comment' : '/me/recording/comment', {
            id: conversationId,
            comment: $('#comment-block').val(),
            _csrf: document.body.dataset.csrfToken
        }).then((res) => {
            if (res.status === 'ok') {
                $('#commentLast').attr('class', 'fa fa-comment-alt');
                $('#comment-popup').modal('toggle');
            }
        });
    });
});

},{"./deps/recorder":2}],2:[function(require,module,exports){
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
/*
Code from https://github.com/mattdiamond/Recorderjs

Copyright 2013 Matt Diamond

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
"use strict";

const InlineWorker = require('inline-worker');

module.exports = class Recorder {

    constructor(source, cfg) {
        this.config = {
            bufferLen: 4096,
            numChannels: 2,
            mimeType: 'audio/wav'
        };

        this.recording = false;

        this.callbacks = {
            getBuffer: [],
            exportWAV: []
        };
        Object.assign(this.config, cfg);
        this.context = source.context;
        this.node = (this.context.createScriptProcessor ||
        this.context.createJavaScriptNode).call(this.context,
            this.config.bufferLen, this.config.numChannels, this.config.numChannels);

        this.node.onaudioprocess = (e) => {
            if (!this.recording) return;

            var buffer = [];
            for (var channel = 0; channel < this.config.numChannels; channel++)
                buffer.push(e.inputBuffer.getChannelData(channel));
            this.worker.postMessage({
                command: 'record',
                buffer: buffer
            });
        };

        source.connect(this.node);
        this.node.connect(this.context.destination);    //this should not be necessary

        let self = {};
        this.worker = new InlineWorker(function () {
            let recLength = 0,
                recBuffers = [],
                sampleRate,
                numChannels;

            this.onmessage = function (e) {
                switch (e.data.command) {
                    case 'init':
                        init(e.data.config);
                        break;
                    case 'record':
                        record(e.data.buffer);
                        break;
                    case 'exportWAV':
                        exportWAV(e.data.type);
                        break;
                    case 'getBuffer':
                        getBuffer();
                        break;
                    case 'clear':
                        clear();
                        break;
                }
            };

            function init(config) {
                sampleRate = config.sampleRate;
                numChannels = config.numChannels;
                initBuffers();
            }

            function record(inputBuffer) {
                for (var channel = 0; channel < numChannels; channel++)
                    recBuffers[channel].push(inputBuffer[channel]);
                recLength += inputBuffer[0].length;
            }

            function exportWAV(type) {
                let buffers = [];
                for (let channel = 0; channel < numChannels; channel++)
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                let interleaved;
                if (numChannels === 2)
                    interleaved = interleave(buffers[0], buffers[1]);
                else
                    interleaved = buffers[0];
                let dataview = encodeWAV(interleaved);
                let audioBlob = new Blob([dataview], {type: type});

                this.postMessage({command: 'exportWAV', data: audioBlob});
            }

            function getBuffer() {
                let buffers = [];
                for (let channel = 0; channel < numChannels; channel++)
                    buffers.push(mergeBuffers(recBuffers[channel], recLength));
                this.postMessage({command: 'getBuffer', data: buffers});
            }

            function clear() {
                recLength = 0;
                recBuffers = [];
                initBuffers();
            }

            function initBuffers() {
                for (let channel = 0; channel < numChannels; channel++)
                    recBuffers[channel] = [];
            }

            function mergeBuffers(recBuffers, recLength) {
                let result = new Float32Array(recLength);
                let offset = 0;
                for (let i = 0; i < recBuffers.length; i++) {
                    result.set(recBuffers[i], offset);
                    offset += recBuffers[i].length;
                }
                return result;
            }

            function interleave(inputL, inputR) {
                let length = inputL.length + inputR.length;
                let result = new Float32Array(length);

                let index = 0,
                    inputIndex = 0;

                while (index < length) {
                    result[index++] = inputL[inputIndex];
                    result[index++] = inputR[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function floatTo16BitPCM(output, offset, input) {
                for (let i = 0; i < input.length; i++, offset += 2) {
                    let s = Math.max(-1, Math.min(1, input[i]));
                    output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
                }
            }

            function writeString(view, offset, string) {
                for (let i = 0; i < string.length; i++)
                    view.setUint8(offset + i, string.charCodeAt(i));
            }

            function encodeWAV(samples) {
                let buffer = new ArrayBuffer(44 + samples.length * 2);
                let view = new DataView(buffer);

                /* RIFF identifier */
                writeString(view, 0, 'RIFF');
                /* RIFF chunk length */
                view.setUint32(4, 36 + samples.length * 2, true);
                /* RIFF type */
                writeString(view, 8, 'WAVE');
                /* format chunk identifier */
                writeString(view, 12, 'fmt ');
                /* format chunk length */
                view.setUint32(16, 16, true);
                /* sample format (raw) */
                view.setUint16(20, 1, true);
                /* channel count */
                view.setUint16(22, numChannels, true);
                /* sample rate */
                view.setUint32(24, sampleRate, true);
                /* byte rate (sample rate * block align) */
                view.setUint32(28, sampleRate * 4, true);
                /* block align (channel count * bytes per sample) */
                view.setUint16(32, numChannels * 2, true);
                /* bits per sample */
                view.setUint16(34, 16, true);
                /* data chunk identifier */
                writeString(view, 36, 'data');
                /* data chunk length */
                view.setUint32(40, samples.length * 2, true);

                floatTo16BitPCM(view, 44, samples);

                return view;
            }
        }, self);

        this.worker.postMessage({
            command: 'init',
            config: {
                sampleRate: this.context.sampleRate,
                numChannels: this.config.numChannels
            }
        });

        this.worker.onmessage = (e) => {
            let cb = this.callbacks[e.data.command].pop();
            if (typeof cb === 'function')
                cb(e.data.data);
        };
    }


    record() {
        this.recording = true;
    }

    stop() {
        this.recording = false;
    }

    clear() {
        this.worker.postMessage({command: 'clear'});
    }

    getBuffer(cb) {
        cb = cb || this.config.callback;
        if (!cb) throw new Error('Callback not set');

        this.callbacks.getBuffer.push(cb);

        this.worker.postMessage({command: 'getBuffer'});
    }

    exportWAV(cb, mimeType) {
        mimeType = mimeType || this.config.mimeType;
        cb = cb || this.config.callback;
        if (!cb) throw new Error('Callback not set');

        this.callbacks.exportWAV.push(cb);

        this.worker.postMessage({
            command: 'exportWAV',
            type: mimeType
        });
    }

    static
    forceDownload(blob, filename) {
        let url = (window.URL || window.webkitURL).createObjectURL(blob);
        let link = window.document.createElement('a');
        link.href = url;
        link.download = filename || 'output.wav';
        let click = document.createEvent("Event");
        click.initEvent("click", true, true);
        link.dispatchEvent(click);
    }
};

},{"inline-worker":3}],3:[function(require,module,exports){
(function (global){(function (){
var WORKER_ENABLED = !!(global === global.window && global.URL && global.Blob && global.Worker);

function InlineWorker(func, self) {
  var _this = this;
  var functionBody;

  self = self || {};

  if (WORKER_ENABLED) {
    functionBody = func.toString().trim().match(
      /^function\s*\w*\s*\([\w\s,]*\)\s*{([\w\W]*?)}$/
    )[1];

    return new global.Worker(global.URL.createObjectURL(
      new global.Blob([ functionBody ], { type: "text/javascript" })
    ));
  }

  function postMessage(data) {
    setTimeout(function() {
      _this.onmessage({ data: data });
    }, 0);
  }

  this.self = self;
  this.self.postMessage = postMessage;

  setTimeout(func.bind(self, self), 0);
}

InlineWorker.prototype.postMessage = function postMessage(data) {
  var _this = this;

  setTimeout(function() {
    _this.self.onmessage({ data: data });
  }, 0);
};

module.exports = InlineWorker;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[1]);
