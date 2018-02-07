/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express');
const path = require('path');
const app = express();
const AmpSsrMiddleware = require('amp-toolbox-optimizer-express');
const ampSSR = require('amp-toolbox-optimizer');
const compression = require('compression');
const httpProxy = require('http-proxy');
const https = require('https');
const runtimeVersion = require('amp-toolbox-runtime-version');
const PreloadImagesTransformer = require('./lib/PreloadImagesTransformer');
const GoogleFontsPreconnectTransformer = require('./lib/GoogleFontsPreconnectTransformer');
const apicache = require('apicache');

const cache = apicache.middleware;

// Configure the transformers to be used.
// otherwise a default configuration is used.
ampSSR.setConfig({
  transformers: [
    new PreloadImagesTransformer(),
    'AddAmpLink',
    'ServerSideRendering',
    'RemoveAmpAttribute',
    // needs to run after ServerSideRendering
    'AmpBoilerplateTransformer',
    // needs to run after ServerSideRendering
    'ReorderHeadTransformer',
    // needs to run after ReorderHeadTransformer
    'RewriteAmpUrls',
    new GoogleFontsPreconnectTransformer()
  ]
});

const target = process.argv[2] || 'https://www.ampbyexample.com'
//
// Create a HTTP Proxy server with a HTTPS target
//
const proxy = httpProxy.createProxyServer({
  agent: https.globalAgent,
  changeOrigin: true,
  target: target,
  headers: {
    'accept-encoding': 'none'
  }
});

proxy.on('error', (err, req, res) => {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });

  res.end('Page not Found');
});

const staticMiddleware = express.static(path.join(__dirname, '/public'));

// Cache pags for 20 mins
app.use(cache('20 minutes'));

// Enable compression
app.use(compression());

const currentVersion = () => runtimeVersion.currentVersion();
app.use(AmpSsrMiddleware.create({
  ampSsr: ampSSR,
  runtimeVersion: currentVersion
}));
app.use(staticMiddleware);
app.use((req, res) => {
  proxy.web(req, res);
});

const port = process.env.PORT || 8080;
app.listen(port);
console.log(`Proxying ${target} on port ${port}`);
