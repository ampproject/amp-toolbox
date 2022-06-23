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
const AmpOptimizerMiddleware = require('../index.js');
const minifyHTML = require('express-minify-html');

app.use((req, res, next) => {
  console.log('handling', req.path);
  return next();
});

// It's important that the AmpOptimizerMiddleware is added *before* the static middleware.
// This allows the middleware to intercept the page rendered by static and transform it.
app.use(AmpOptimizerMiddleware.create());

app.use(
  minifyHTML({
    override: true,
    exception_url: false,
    htmlMinifier: {
      removeComments: true,
      collapseWhitespace: true,
      collapseBooleanAttributes: true,
      removeAttributeQuotes: true,
      removeEmptyAttributes: true,
      minifyJS: true,
    },
  })
);

const staticMiddleware = express.static(path.join(__dirname, '/public'));
app.use(staticMiddleware);

const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;
app.listen(port, () => {
  console.log('Example app listening on port 3000!');
});
