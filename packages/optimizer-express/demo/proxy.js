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
const app = express();
const AmpOptimizerMiddleware = require('@ampproject/toolbox-optimizer-express');
const compression = require('compression');
const httpProxy = require('http-proxy');
const https = require('https');
const apicache = require('apicache');

const cache = apicache.middleware;

// Read proxy for command line, or default to ampbyexample.com.
const target = process.argv[2] || 'https://amp.dev';

// Create a HTTP Proxy server the target
const proxy = httpProxy.createProxyServer({
  agent: https.globalAgent,
  changeOrigin: true,
  target: target,
  headers: {
    // We force encoding to avoid issues with data decompression.
    'accept-encoding': 'none',
  },
});

// http-proxy doesn't handle errors by default, and crashes the server. Se we add our own handler.
proxy.on('error', (err, req, res) => {
  res.writeHead(404, {
    'Content-Type': 'text/plain',
  });

  res.end('Page not Found');
});

// Enable caching
app.use(cache('20 minutes'));

// Enable compression
app.use(compression());

// Enable the Optimizer middleware.
app.use(AmpOptimizerMiddleware.create());

// Handle requests through the proxy.
app.use((req, res) => {
  proxy.web(req, res);
});

const port = process.env.PORT || 8080;
app.listen(port);
console.log(`Proxying ${target} on port ${port}`);
