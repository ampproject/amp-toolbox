/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

require('fetch-mock');
const createSpec = require('../helpers/TransformerRunner.js');
const ampOptimizer = require('../../index.js');
const fetchMock = require('fetch-mock');
const fetch = fetchMock.sandbox().mock('https://cdn.ampproject.org/rtv/001515617716922/v0.css', '/* v0.css */');

ampOptimizer.setConfig({
  fetch,
});

createSpec({
  name: 'End-to-End',
  testDir: __dirname,
  transformer: {
    transform: (tree, params) => ampOptimizer.transformTree(tree, params),
  },
});
