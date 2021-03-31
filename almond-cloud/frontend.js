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

const express = require('express');
const http = require('http');
const url = require('url');
const path = require('path');
const morgan = require('morgan');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const csurf = require('csurf');
const passport = require('passport');
const connect_flash = require('connect-flash');
const cacheable = require('cacheable-middleware');
const xmlBodyParser = require('express-xml-bodyparser');
const Prometheus = require('prom-client');
const escapeHtml = require('escape-html');

const passportUtil = require('./util/passport');
const secretKey = require('./util/secret_key');
const db = require('./util/db');
const I18n = require('./util/i18n');
const userUtils = require('./util/user');
const Metrics = require('./util/metrics');
const errorHandling = require('./util/error_handling');
const codeStorage = require('./util/code_storage');
const EngineManager = require('./almond/enginemanagerclient');

const Config = require('./config');

class Frontend {
    constructor(port) {
        // all environments
        this._app = express();

        this.server = http.createServer(this._app);
        require('express-ws')(this._app, this.server);

        this._app.set('port', port);
        this._app.set('views', path.join(__dirname, 'views'));
        this._app.set('view engine', 'pug');
        this._app.enable('trust proxy');

        // provide a very-early version of req._ in case something
        // early in the request stack fails and we hit the error handler
        this._app.use((req, res, next) => {
            req.locale = 'en-US';
            req.gettext = (x) => x;
            req._ = (x) => x;
            req.pgettext = (c, x) => x;
            req.ngettext = (x, x2, n) => n === 1 ? x : x2;

            res.locals.I18n = I18n;
            res.locals.locale = 'en-US';
            res.locals.gettext = req.gettext;
            res.locals._ = req._;
            res.locals.pgettext = req.pgettext;
            res.locals.ngettext = req.ngettext;

            res.locals.timezone = 'America/Los_Angeles';
            next();
        });
        this._app.use((req, res, next) => {
            // Capital C so we don't conflict with other parameters
            // set by various pages
            res.locals.Config = Config;
            res.locals.Constants = {
                Role: userUtils.Role,
                DeveloperStatus: userUtils.DeveloperStatus,
                ProfileFlags: userUtils.ProfileFlags
            };
            res.locals.escapeHtml = escapeHtml;

            // the old way of doing things - eventually should be refactored
            res.locals.CDN_HOST = Config.CDN_HOST;
            res.locals.THINGPEDIA_URL = Config.THINGPEDIA_URL;
            res.locals.WITH_THINGPEDIA = Config.WITH_THINGPEDIA;
            res.locals.ENABLE_ANONYMOUS_USER = Config.ENABLE_ANONYMOUS_USER;
            next();
        });

        // work around a crash in expressWs if a WebSocket route fails with an error
        // code and express-session tries to save the session
        this._app.use((req, res, next) => {
            if (req.ws) {
                const originalWriteHead = res.writeHead;
                res.writeHead = function(statusCode) {
                    originalWriteHead.apply(this, arguments);
                    http.ServerResponse.prototype.writeHead.apply(this, arguments);
                };
            }

            next();
        });

        // set up logging first
        this._app.use(morgan('dev'));
        if (Config.ENABLE_PROMETHEUS)
            Metrics(this._app);

        const IS_ALMOND_WEBSITE = Config.SERVER_ORIGIN === 'https://almond.stanford.edu';

        const SERVER_NAME = url.parse(Config.SERVER_ORIGIN).hostname;
        if (Config.ENABLE_REDIRECT) {
            this._app.use((req, res, next) => {
                let redirect = false;
                if (req.headers['x-forwarded-proto'] === 'http')
                    redirect = true;
                // don't redirect if there is no hostname
                // (it's a health-check from the load balancer)
                if (req.hostname && req.hostname !== SERVER_NAME)
                    redirect = true;
                if (IS_ALMOND_WEBSITE && (!req.hostname || (!req.hostname.endsWith('.stanford.edu') && req.hostname !== 'www.thingpedia.org')))
                    redirect = false;
                // don't redirect certain API endpoints because the client code
                // doesn't cope well
                if (req.originalUrl.startsWith('/thingpedia/api') ||
                    req.originalUrl.startsWith('/thingpedia/download') ||
                    req.originalUrl.startsWith('/api/webhook') ||
                    req.originalUrl.startsWith('/ws'))
                    redirect = false;
                if (redirect) {
                    if (req.hostname === 'thingpedia.stanford.edu' && req.originalUrl === '/')
                        res.redirect(301, Config.SERVER_ORIGIN + '/thingpedia');
                    else
                        res.redirect(301, Config.SERVER_ORIGIN + req.originalUrl);
                    return;
                }
                next();
            });
        }
        if (Config.ENABLE_SECURITY_HEADERS) {
            // security headers
            this._app.use((req, res, next) => {
                res.set('Strict-Transport-Security', 'max-age=31536000');
                //res.set('Content-Security-Policy', `default-src 'self'; connect-src 'self' https://*.stanford.edu ; font-src 'self' https://maxcdn.bootstrapcdn.com https://fonts.googleapis.com ; img-src * ; script-src 'self' https://code.jquery.com https://maxcdn.bootstrapcdn.com 'unsafe-inline' ; style-src 'self' https://fonts.googleapis.com https://maxcdn.bootstrapcdn.com 'unsafe-inline'`);
                res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
                res.set('X-Frame-Options', 'DENY');
                res.set('X-Content-Type-Options', 'nosniff');
                next();
            });
        }

        this._app.use('/assets', (req, res, next) => {
            res.set('Access-Control-Allow-Origin', '*');
            next();
        });
        this._app.use(favicon(__dirname + '/public/images/favicon.ico'));
        this._app.use('/assets', express.static(path.join(__dirname, 'public'),
                                                { maxAge: 86400000 }));
        codeStorage.initFrontend(this._app);
        this._app.use(cacheable());
        passportUtil.initialize();

        this._app.use(bodyParser.json());
        this._app.use(bodyParser.urlencoded({ extended: true }));
        this._app.use(xmlBodyParser({ explicitArray: true, trim: false }));

        // mount the public APIs before passport.session, so cookie authentication
        // does not leak into them (which prevents cross-origin attacks because the APIs are CORS-enabled)

        // sinkholes are dummy routes used by demo devices
        this._app.get('/sinkhole', (req, res, next) => {
            res.send('');
        });
        this._app.post('/sinkhole', (req, res, next) => {
            res.send('');
        });
        this._app.use('/api/webhook', require('./routes/webhook'));
        this._app.use('/me/api/alexa', require('./routes/bridges/alexa'));
        this._app.use('/me/api/gassistant', require('./routes/bridges/gassistant'));
        this._app.use('/me/api', require('./routes/my_api'));

        // legacy route for /me/api/sync, uses auth tokens instead of full OAuth2
        this._app.use('/ws', require('./routes/thingengine_ws'));

        if (Config.WITH_THINGPEDIA === 'embedded') {
            this._app.use('/thingpedia/api', require('./routes/thingpedia_api'));
            // legacy, part of v1/v2 API, in v3 this endpoint lives as /v3/devices/package
            this._app.use('/thingpedia/download', require('./routes/thingpedia_download'));
        }

        // now initialize cookies, session and session-based logins

        this._app.use(cookieParser(secretKey.getSecretKey()));
        this._sessionStore = new MySQLStore({
            expiration: 86400000 // 1 day, in ms
        }, db.getPool());
        this._app.use(session({ resave: false,
                                saveUninitialized: false,
                                store: this._sessionStore,
                                secret: secretKey.getSecretKey() }));
        this._app.use(connect_flash());
        this._app.use(passport.initialize());
        this._app.use(passport.session());

        // this is an authentication kludge used by the Android app
        // the app loads the index with ?app, which causes us to respond with
        // a WWW-Authenticate header, and then the app injects basic authentication
        // info (cloud id + auth token) in the browser
        // this is not great, but we must keep it until the app is updated to
        // use OAuth tokens instead
        var basicAuth = passport.authenticate('basic', { failWithError: true });
        this._app.use((req, res, next) => {
            if (req.query.auth === 'app') {
                basicAuth(req, res, (err) => {
                    if (err)
                        res.status(401);
                    // eat the error

                    // skip 2fa if successful
                    if (!err && req.user)
                        req.session.completed2fa = true;

                    next();
                });
            } else {
                next();
            }
        });
        this._app.use((req, res, next) => {
            res.locals.user = req.user;
            res.locals.authenticated = userUtils.isAuthenticated(req);
            next();
        });
        this._app.use(I18n.handler);

        // initialize csurf after any route that uses file upload.
        // because file upload uses multer, which must be initialized before csurf
        // MAKE SURE ALL ROUTES HAVE CSURF
        if (Config.WITH_THINGPEDIA === 'embedded') {
            this._app.use('/thingpedia/upload', require('./routes/thingpedia_upload'));
            this._app.use('/thingpedia/entities', require('./routes/thingpedia_entities'));
            this._app.use('/thingpedia/strings', require('./routes/thingpedia_strings'));
        }
        if (Config.WITH_LUINET === 'embedded') {
            this._app.use('/luinet/templates', require('./routes/luinet_templates'));
            this._app.use('/developers/mturk', require('./routes/developer_mturk'));
        }
        this._app.use('/developers/oauth', require('./routes/developer_oauth2'));
        this._app.use('/admin/blog/upload', require('./routes/admin_upload'));

        this._app.use(csurf({ cookie: false }));
        this._app.use((req, res, next) => {
            res.locals.csrfToken = req.csrfToken();
            next();
        });

        this._app.use('/', require('./routes/about'));
        this._app.use('/', require('./routes/qrcode'));
        this._app.use('/blog', require('./routes/blog'));
        this._app.use('/mturk', require('./routes/mturk'));

        this._app.use('/me/ws', require('./routes/my_internal_api'));
        this._app.use('/me', require('./routes/my_stuff'));
        this._app.use('/me/api/oauth2', require('./routes/my_oauth2'));
        this._app.use('/me/devices', require('./routes/devices'));
        this._app.use('/me/status', require('./routes/status'));
        this._app.use('/me/recording', require('./routes/my_recording'));
        this._app.use('/devices', require('./routes/devices_compat'));

        this._app.use('/developers', require('./routes/developer_console'));
        if (Config.WITH_THINGPEDIA === 'embedded')
            this._app.use('/developers/alexa', require('./routes/developer_alexa'));

        if (Config.WITH_THINGPEDIA === 'embedded') {
            this._app.use('/thingpedia', require('./routes/thingpedia_portal'));
            this._app.use('/thingpedia/commands', require('./routes/commandpedia'));

            this._app.use('/thingpedia/examples', require('./routes/thingpedia_examples'));
            this._app.use('/thingpedia/devices', require('./routes/thingpedia_devices'));
            this._app.use('/thingpedia/classes', require('./routes/thingpedia_schemas'));
            this._app.use('/thingpedia/translate', require('./routes/thingpedia_translate'));
            this._app.use('/thingpedia/cheatsheet', require('./routes/thingpedia_cheatsheet'));
            this._app.use('/thingpedia/snapshots', require('./routes/thingpedia_snapshots'));
        }
        if (Config.WITH_LUINET === 'embedded') {
            this._app.use('/luinet/datasets', require('./routes/luinet_dataset'));
            this._app.use('/luinet/models', require('./routes/luinet_models'));
            this._app.use('/luinet/custom-datasets', require('./routes/luinet_custom_datasets'));
        }

        this._app.use('/profiles', require('./routes/thingpedia_profiles'));
        this._app.use('/user', require('./routes/user'));
        this._app.use('/admin', require('./routes/admin'));
        this._app.use('/admin/mturk', require('./routes/admin_mturk'));
        this._app.use('/proxy', require('./routes/proxy'));

        this._app.use((req, res) => {
            // if we get here, we have a 404 response
            res.status(404).render('error', {
                page_title: req._("Almond - Page Not Found"),
                message: req._("The requested page does not exist.")
            });
        });
        this._app.use(errorHandling.html);

        this._websocketEndpoints = {};
    }

    open() {
        // '::' means the same as 0.0.0.0 but for IPv6
        // without it, node.js will only listen on IPv4
        return new Promise((resolve, reject) => {
            this.server.listen(this._app.get('port'), '::', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }).then(() => {
            console.log('Express server listening on port ' + this._app.get('port'));
        });
    }

    close() {
        // close the server asynchronously to avoid waiting on open
        // connections
        this.server.close((error) => {
            if (error) {
                console.log('Error stopping Express server: ' + error);
                console.log(error.stack);
            } else {
                console.log('Express server stopped');
            }
        });
        this._sessionStore.close();
        return Promise.resolve();
    }
}

module.exports = {
    initArgparse(subparsers) {
        const parser = subparsers.add_parser('run-frontend', {
            description: 'Run a Web Almond frontend'
        });
        parser.add_argument('-p', '--port', {
            required: false,
            type: Number,
            help: 'Listen on the given port',
            default: 8080
        });
    },

    main(argv) {
        const frontend = new Frontend(argv.port);
        const enginemanager = new EngineManager();
        enginemanager.start();

        let metricsInterval = null;
        if (Config.ENABLE_PROMETHEUS)
            metricsInterval = Prometheus.collectDefaultMetrics();

        async function handleSignal() {
            if (metricsInterval)
                clearInterval(metricsInterval);
            await frontend.close();
            await enginemanager.stop();
            await db.tearDown();
            process.exit();
        }

        process.on('SIGINT', handleSignal);
        process.on('SIGTERM', handleSignal);

        // open the HTTP server
        frontend.open();
    }
};
