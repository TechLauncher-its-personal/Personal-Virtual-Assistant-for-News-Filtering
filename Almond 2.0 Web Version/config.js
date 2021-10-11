// Custom config.js file to suite our project requirements

// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of Almond
//
// Copyright 2018-2020 The Board of Trustees of the Leland Stanford Junior University
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

// gettext marker
function _(x) { return x; }

/**
  Database URL.

  This must be the URL of the MySQL server shared by all almond-cloud components.

  The format is:
  ```
  mysql://<user>:<password>@<hostname>/<db_name>?<options>
  ```
  See the documentation of node-mysql for options.
  If you use Amazon RDS, you should say so with `ssl=Amazon%20RDS`.
  It is recommended you set `timezone=Z` in the options (telling the database to store dates and times in UTC timezone).

  For legacy reasons, this defaults to the `DATABASE_URL` environment variable.
  Using environment variables is currently secure but deprecated (because it can lead to security bugs).

  Note: do not set this in `custom_config.js`, only in `/etc/almond-cloud/config.js`.
  module.exports.DATABASE_URL = process.env.DATABASE_URL;
  mysql://thingengine:thingengine@localhost/thingengine?charset=utf8mb4_bin";
  UPDATE user SET authentication_string=password('elephant7') WHERE user='root';
  module.exports.DATABASE_URL = 'mysql://root:elephant7@%/almond?charset=utf8mb4_bin';
  module.exports.DATABASE_URL = 'mysql://smj:Smj990804@qq.com@45.76.121.127/almond?charset=utf8mb4_bin';
  module.exports.DATABASE_URL = 'mysql://ccc@45.76.121.127/almond?timezone=Z';
*/
module.exports.DATABASE_URL = 'mysql://sb:990804@139.180.181.119/almond?timezone=Z';


/**
  Secret key for cookie signing.

  This can be an arbitrary secret string. It is recommended to choose 64 random HEX characters (256 bit security).
  Choose a secure secret to prevent session hijacking.

  For legacy reasons, this defaults to the `SECRET_KEY` environment variable.
  Using environment variables is currently secure but deprecated (because it can lead to security bugs).
  The server will refuse to start if this option is not set.
  module.exports.SECRET_KEY = process.env.SECRET_KEY;
  "75d7d51f0c84f482 e99fc09f428fb454 9a15f6caae0ba0b8 28e3672d86be6a90 a17e5eb35e1b8d1e bb231baad63f8800 47bc667b89ef45aa 64a02d1a4dd4c74b"
*/

module.exports.SECRET_KEY = '0B37FDC0FF2FB325D8C47FA80D030265CA874214E1C36A20F15E34CB60240C79';


/**
  Secret key for JsonWebToken signing (OAuth 2.0 tokens)

  This can be an arbitrary secret string. It is recommended to choose 64 random HEX characters (256 bit security).
  Choose a secure secret to prevent forging OAuth access tokens.

  For legacy reasons, this defaults to the `JWT_SIGNING_KEY` environment variable.
  Using environment variables is currently secure but deprecated (because it can lead to security bugs).
  The server will refuse to start if this option is not set.
*/

module.exports.JWT_SIGNING_KEY = '9EFF1C3916827FFFCFAF0338ED1D146EB5913C4C665F4816A8129346DFFC50E2';

/**
  Symmetric encryption key for user authentication material

  This key is used whenever user-authentication-related secret material must be encrypted symmetrically,
  rather than simply hashed. In particular, it is used to encrypt and decrypt per-user 2-factor keys.

  This secret must be exactly 32 hex characters (128 bits).

  For legacy reasons, this defaults to the `AES_SECRET_KEY` environment variable.
  Using environment variables is currently secure but deprecated (because it can lead to security bugs).
  The server will refuse to start if this option is not set.
*/
module.exports.AES_SECRET_KEY = 'c84345ab25f20474014fee5894c5b179';


/**
  Address of each master process.

  Each address must be specified in sockaddr form:
  - absolute or relative path for Unix socket
  - hostname:port for TCP

  Multiple addresses can be provided, in which case the users will be sharded across
  multiple masters based on their ID (using a simple hashing scheme).

  The number of shards can be changed dynamically, provided all processes use
  a consistent configuration (they must be all stopped when the configuration is changed),
  and all shards have access to shared storage (e.g. NFS).
  If the storage is not shared, use the `get-user-shards` to compute which user is
  assigned to which shard, and transfer the user's folder appropriately.
*/
module.exports.THINGENGINE_MANAGER_ADDRESS = ['./control'];
/**
  Access token to communicate with the master process.

  This **must** be set if communication happens over to TCP, but can be left to
  the default `null` value if communication happens over Unix domain sockets, in which
  case file system permissions are used to restrict access.
*/
module.exports.THINGENGINE_MANAGER_AUTHENTICATION = null;

/**
  Thingpedia configuration.

  Set this option to 'embedded' to enable the embedded Thingpedia,
  to 'external' to use the Thingpedia at THINGPEDIA_URL.
*/
module.exports.WITH_THINGPEDIA = 'external';
/**
  Thingpedia URL

  This is used by the Almond backend to communicate with the external Thingpedia,
  and it is also used to construct links to Thingpedia from My Almond.
  It **must** be set to `'/thingpedia'` to use the embedded Thingpedia.
  module.exports.THINGPEDIA_URL = 'https://thingpedia.stanford.edu/thingpedia';
*/
module.exports.THINGPEDIA_URL = 'https://almond.stanford.edu/thingpedia';

/**
  Default Thingpedia developer key to use for Web Almond.
  In external Thingpedia mode, this Thingpedia key will be made available to all
  users that do not have another key configured, so they can access private devices
  from the external Thingpedia.
  The developer program must be disabled for this key to have any effect
  (ENABLE_DEVELOPER_PROGRAM = false), and this key has no effect in embedded Thingpedia mode.
  This key only affects users running Web Almond. To configure the key used by
  the embedded NLP server, set NL_THINGPEDIA_DEVELOPER_KEY.
*/
module.exports.THINGPEDIA_DEVELOPER_KEY = '7b0e41f37d6350205c9b6e500ab79ee10fdd7f1ae8baab5497ea2027e7e755b3';

/**
  Thingpedia developer key to use for the root user in Web Almond.
  In external Thingpedia mode, the initially created root user and all users in the
  root organization will use this developer key. If unset, the root user will use a
  randomly generated Thingpedia key.
  This key has no effect in embedded Thingpedia mode.
*/
module.exports.ROOT_THINGPEDIA_DEVELOPER_KEY = '7b0e41f37d6350205c9b6e500ab79ee10fdd7f1ae8baab5497ea2027e7e755b3';

/**
  Where to store icons and zip files.

  This can be a relative or absolute path, or a file: or s3: URI.
  The location must be writable by the frontend Almond processes.
  Relative paths are interpreted relative to the current working directory, or
  the `THINGENGINE_ROOTDIR` environment variable if set.

  NOTE: correct operation requires file: URIs to use the local hostname, that is, they should
  be of the form `file:///`, with 3 consecutive slashes.
*/
module.exports.FILE_STORAGE_DIR = './shared/download';

/**
  Where to cache entity icons and contact avatars.

  This can be a relative or absolute path.
  The location must be writable by the frontend Almond processes.
  Relative paths are interpreted relative to the current working directory, or
  the `THINGENGINE_ROOTDIR` environment variable if set.

  Note: unlike other _DIR configuration keys, this key cannot be a URL. The cache directory
  is always on the local machine where the Almond process runs.
*/
module.exports.CACHE_DIR = './shared/cache';

/**
  The location where icons and zip files can be retrieved.

  If using S3 storage, this could be the S3 website URL, or the URL
  of a CloudFront distribution mapping to the S3 bucket.
  If using local storage, or if no CDN is available, it must be the
  exact string `"/download"`.
*/
module.exports.CDN_HOST = '/download';

/**
  The CDN to use for website assets (javascript, css, images files contained in public/ )

  You should configure your CDN to map the URL you specify here to the /assets
  path on the frontend server (SERVER_ORIGIN setting).

  Use a fully qualified URL (including https://) and omit the trailing slash.
  Use the default `/assets` if you do not want to use a CDN, in which case assets will
  be loaded directly from your configured frontend server.
*/
module.exports.ASSET_CDN = '/assets';

/**
  Which branding to use for the website.

  Valid values are "generic" (no branding) or "stanford" (Stanford University logo and
  footer). Note that the Stanford University logo is a registered trademark, and therefore
  using "stanford" branding requires permission.
*/
module.exports.USE_BRAND = 'generic';

/**
  The origin (scheme, hostname, port) where the server is reachable.

  This is used for redirects and CORS checks.
*/
module.exports.SERVER_ORIGIN = 'http://personal.xhlife.com.au';

/**
  Enable redirection to SERVER_ORIGIN for requests with different hostname
  or scheme.

  Use this to enable transparent HTTP to HTTPS redirection.
*/
module.exports.ENABLE_REDIRECT = true;

/**
  Enable HTTPs security headers.

  Enable Strict-Transport-Security, Content-Security-Policy and other
  headers. This option has no effect if the server is not available over TLS.
*/
module.exports.ENABLE_SECURITY_HEADERS = false;

/**
  Override which pug file to use for about pages.

  Use this option to customize the index, terms-of-service, etc. pages
  The key should be the page name (part of path after /about),
  the value should be the name of a pug file in views, without the .pug
  extension.

  If unspecified, defaults to "about_" + page_name, eg. for `privacy`
  it defaults to showing `about_privacy.pug`.

  If you plan to serve Web Almond to users and allow registration,
  at the minimum you must override the `tos` page (terms of service) and the
  `privacy` page (privacy policy), as they are empty in the default installation.

  Use ABOUT_OVERRIDE['index'] to override the whole website index.
  Note that "/about" with no page unconditionally redirects to "/"
  module.exports.ABOUT_OVERRIDE = {
    index: 'stanford/about_index.pug',
    tos: 'stanford/about_tos.pug',
    privacy: 'stanford/about_privacy.pug'
  };
*/
module.exports.ABOUT_OVERRIDE = {};

/**
  Adds new pages to the /about hierarchy

  This option is an array of objects. The format should be:
  ```
  {
    url: path name, excluding /about part
    title: page title
    view: name of pug file
  }
  ```
  module.exports.EXTRA_ABOUT_PAGES = [
    {
      url: 'get-almond',
      view: 'stanford/about_get_almond.pug',
      title: _("Get Almond")
    },
    {
      url: 'get-involved',
      view: 'stanford/about_get_involved.pug',
      title: _("Get Involved With Almond")
    }
  ];
*/
module.exports.EXTRA_ABOUT_PAGES = [
  {
    url: 'us',
    view: 'about_us.pug',
    title: _("About Us | ISS Personal Assistant")
  }
];

/**
  Adds new links to the navbar

  This option is an array of objects. The format should be:
  ```
  {
    url: link URL
    title: link title
  }
  ```
  module.exports.EXTRA_NAVBAR = [
    {
      url: 'https://oval.cs.stanford.edu',
      title: _("OVAL Lab"),
    }
  ];
*/
module.exports.EXTRA_NAVBAR = [];

/**
  Additional origins that should be allowed to make Cookie-authenticated
  API requests.

  Note: this is a very unsafe option, and can easily lead to credential
  leaks. Use this at your own risk.
*/
module.exports.EXTRA_ORIGINS = [];

/**
  The base URL used for OAuth redirects

  This is used by the OAuth configuration mechanism for accounts/devices
  in Web Almond. It is used by Login With Google. The full OAuth redirect
  URI for Google is OAUTH_REDIRECT_ORIGIN + `/user/oauth2/google/callback`

  By default, it is the same as SERVER_ORIGIN, but you can change it
  if you put a different value in the developer console / redirect URI
  fields of the various services.
*/
module.exports.OAUTH_REDIRECT_ORIGIN = module.exports.SERVER_ORIGIN;

/**
  Enable anonymous user.

  Set this option to true to let users try out Almond without logging in.
  They will operate as the user "anonymous".
*/
module.exports.ENABLE_ANONYMOUS_USER = true;

/**
  Enable developer program.

  Set this option to allow users to become Almond developers, and create
  OAuth apps that access the Web Almond APIs, as well as new Thingpedia
  devices or LUInet models.
*/
module.exports.ENABLE_DEVELOPER_PROGRAM = false;

/**
  LUInet (Natural Language model/server) configuration

  Set this to 'external' for a configuration using a public Natural Language
  server, and 'embedded' if you manage your own NLP server.

  Setting this to 'embedded' enables the configuration UI to manage models
  and train.
*/
module.exports.WITH_LUINET = 'external';

/**
  The URL of a genie-compatible Natural Language inference server.

  This must be set to the full URL both if you use the public NL inference
  server, and if you use the embedded server.
  module.exports.NL_SERVER_URL = 'https://almond-nl.stanford.edu';
*/
module.exports.NL_SERVER_URL = 'http://home.xhlife.com.au:8400';
/**
  Access token for administrative operations in the NLP inference server.

  This tokens controls the ability to reload models from disk. It should
  be shared between the NLP training server and NLP inference server.

  This must be not null if `WITH_LUINET` is set to 'embedded'.
*/
module.exports.NL_SERVER_ADMIN_TOKEN = null;
/**
  Developer key to use from the NLP server to access Thingpedia.

  Set this key to your Thingpedia developer key if you're configuring a custom
  NLP server but you want to use the public Thingpedia.
*/
module.exports.NL_THINGPEDIA_DEVELOPER_KEY = '7b0e41f37d6350205c9b6e500ab79ee10fdd7f1ae8baab5497ea2027e7e755b3';

/**
  Deployed model directory.

  This is the path containing the models that should be served by the NLP inference
  server. It can be a relative or absolute path, or a file: or s3: URI.
  Relative paths are interpreted relative to the current working directory, or
  the `THINGENGINE_ROOTDIR` environment variable if set.

  For a file URI, if the training and inference servers are on different machines,
  you should specify the hostname of the inference server. The training server will
  use `rsync` to upload the model after training.

  If this is set to `null`, trained models will not be uploaded to a NLP inference
  server. This is not a valid setting for the inference server.
*/
module.exports.NL_MODEL_DIR = './models';

/**
  Directory for exact match files.

  This is the path containing the binary format files for the exact matcher.
  It can be a relative or absolute path, or a file: or s3: URI.
  Relative paths are interpreted relative to the current working directory, or
  the `THINGENGINE_ROOTDIR` environment variable if set.
*/
module.exports.NL_EXACT_MATCH_DIR = './exact';

/**
  NLP Service name.

  The kubernetes service name for NLP server.

*/
module.exports.NL_SERVICE_NAME = 'nlp';


/**
  Use kf serving inference service.

  Will make HTTP requests to models that are hosted in kf-serving inference service.
*/
module.exports.USE_KF_INFERENCE_SERVICE = false;

/**
  Training server URL.

  This URL will be called from the Thingpedia web server when a new device
  is updated.
*/
module.exports.TRAINING_URL = null;

/**
  Access token for the training server.

  This token protects all requests to the training server.
*/
module.exports.TRAINING_ACCESS_TOKEN = null;

/**
  Maximum memory usage for training processes.

  In megabytes.
*/
module.exports.TRAINING_MEMORY_USAGE = 24000;

/**
  The directory to use to store training jobs (datasets, working directories and trained models).

  This can be a relative or absolute path, or a file: or s3: URI.
  Relative paths are interpreted relative to the current working directory, or
  the `THINGENGINE_ROOTDIR` environment variable if set.

  NOTE: correct operation requires file: URIs to use the local hostname, that is, they should
  be of the form `file:///`, with 3 consecutive slashes.
*/
module.exports.TRAINING_DIR = './training';

/**
  Which backend to use to run compute-intensive training tasks.

  Valid options are `local`, which spawns a local process, and `kubernetes`, which creates
  a Kubernetes Job. If `kubernetes` is chosen, the training controller must be executed in
  a training cluster and must run a service account with sufficient privileges to create and watch Jobs.
*/
module.exports.TRAINING_TASK_BACKEND = 'local';

/**
  The Docker image to use for training using Kubernetes.

  The suffix `-cuda` will be appended to the version for GPU training.
*/
module.exports.TRAINING_KUBERNETES_IMAGE = 'stanfordoval/almond-cloud:latest-decanlp';

/**
  The namespace for Kubernetes Jobs created for training.
*/
module.exports.TRAINING_KUBERNETES_NAMESPACE = 'default';

/**
  Prefix to add to the Kubernetes Jobs and Pods created for training.
*/
module.exports.TRAINING_KUBERNETES_JOB_NAME_PREFIX = '';

/**
  Additional labels to add to the Kubernetes Jobs and Pods created for training.
*/
module.exports.TRAINING_KUBERNETES_EXTRA_METADATA_LABELS = {};

/**
  Additional annotations to add to the Kubernetes Jobs and Pods created for training.
*/
module.exports.TRAINING_KUBERNETES_EXTRA_ANNOTATIONS = {};

/**
  Additional fields to add to the Kubernetes Pods created for training.
*/
module.exports.TRAINING_KUBERNETES_POD_SPEC_OVERRIDE = {};

/**
  Additional fields to add to the Kubernetes Pods created for training.
*/
module.exports.TRAINING_KUBERNETES_CONTAINER_SPEC_OVERRIDE = {};

/**
  Number of tries to watch k8s job status. Setting to a negative number will try indefinitely.
*/
module.exports.TRAINING_WATCH_NUM_TRIES = 5;

/**
  Directory in s3:// or file:// URI, where tensorboard events are synced to during training.
*/
module.exports.TENSORBOARD_DIR = null;

/**
  OAuth Client ID to support Login With Google
*/
module.exports.GOOGLE_CLIENT_ID = null;

/**
  OAuth Client secret to support Login With Google
*/
module.exports.GOOGLE_CLIENT_SECRET = null;

/**
  OAuth Client ID to support Login With Github
*/
module.exports.GITHUB_CLIENT_ID = null;

/**
  OAuth Client secret to support Login With Github
*/
module.exports.GITHUB_CLIENT_SECRET = null;

/**
   Mailgun user name

   For emails sent from Almond
*/
module.exports.MAILGUN_USER = null;

/**
   Mailgun password

   For emails sent from Almond
*/
module.exports.MAILGUN_PASSWORD = null;

/**
  From: field of user emails (email verification, password reset, etc.)
*/
module.exports.EMAIL_FROM_USER = 'Almond <noreply@almond.stanford.edu>';
/**
  From: field of admin emails (review requests, developer requests, etc.)
*/
module.exports.EMAIL_FROM_ADMIN = 'Almond <root@almond.stanford.edu>';
/**
  From: field of admin-training notifications
*/
module.exports.EMAIL_FROM_TRAINING = 'Almond Training Service <almond-training@almond.stanford.edu>';

/**
  To: field of admin emails

  Automatically generated email notifications (such as training failures)
  will be sent to this address.
*/
module.exports.EMAIL_TO_ADMIN = 'thingpedia-admins@lists.stanford.edu';

/**
  The primary "messaging" device.

  This is offered as the default device to configure for communicating
  assistants, if no other messaging device is available.
*/
module.exports.MESSAGING_DEVICE = 'org.thingpedia.builtin.matrix';

/**
  Enable metric collection using Prometheus.

  If set to `true`, all web servers will expose a Prometheus-compatible `/metrics` endpoint.
*/
module.exports.ENABLE_PROMETHEUS = false;
/**
  Access token to use for /metrics endpoint.

  If null, the endpoint will have no authentication, and metric data will
  be publicly readable.

  This value should match the "bearer_token" prometheus configuration value.
*/
module.exports.PROMETHEUS_ACCESS_TOKEN = null;

/**
  Secret for Discourse Single-Sign-On

  See https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
  for the protocol.

  SSO will be disabled (404 error) if SSO_SECRET or SSO_REDIRECT is null.

  Unlike OAuth, there is no "confirm" step before user's data is sent to the
 requesting service, hence this secret REALLY must be secret.
*/
module.exports.DISCOURSE_SSO_SECRET = null;
/**
  Redirect URL for Discourse Single-Sign-On.

  Set this to the URL of your Discourse installation. This should be the origin
  (scheme-hostname-port) only, `/session/sso_login` will be appended.
*/
module.exports.DISCOURSE_SSO_REDIRECT = 'https://discourse.almond.stanford.edu';

/**
  What natural languages are enabled, as BCP47 locale tags.

  Defaults to American English only

  Note that this must contain at least one language, or the server will fail
  to start.
*/
module.exports.SUPPORTED_LANGUAGES = ['en-US'];

/**
  MapQuest API key.

  This is key is used to provide the location querying API. If unset, it will
  fallback to the public Nominatim API, which has a low API quota.
*/
module.exports.MAPQUEST_KEY = null;
 
/**
  URL of an [Ackee](https://github.com/electerious/Ackee) server to use for page tracking.

  This property must contain the full URL (protocol, hostname, optional port) of the server,
  and must not end with a slash.
  If null, tracking will be disabled.
*/
module.exports.ACKEE_URL = null;

/**
  Domain ID to use for [Ackee](https://github.com/electerious/Ackee) tracking.

  This must be set if `ACKEE_URL` is set.
*/
module.exports.ACKEE_DOMAIN_ID = null;

/**
  URL of a server supporting speech-to-text and text-to-speech.
*/
module.exports.VOICE_SERVER_URL = 'https://voice.almond.stanford.edu';

/**
  Azure subscription key for Microsoft Speech Services SDK
*/
module.exports.MS_SPEECH_SUBSCRIPTION_KEY = null;

/**
  Azure region identifier for Microsoft Speech Services SDK
*/
module.exports.MS_SPEECH_SERVICE_REGION = null;
