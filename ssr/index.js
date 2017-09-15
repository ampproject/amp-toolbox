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
'use strict';

const DomTransfomer = require('./lib/DomTransformer.js');

const defaultConfig = {
  transformers: [
    'AddAmpLink',
    'ServerSideRendering',
    'RemoveAmpAttribute',
    'AmpBoilerplateTransformer', // needs to run after ServerSideRendering
    'ReorderHeadTransformer',    // needs to run last
    'RewriteAmpUrls'            // needs to run after ReorderHeadTransformer
  ].map(loadTransformer)
};

function loadTransformer(name) {
  return require('./lib/transformers/' + name + '.js');
}

module.exports = {
  createTransformer: config => {
    config = Object.assign(defaultConfig, config);
    return DomTransfomer.create(config);
  },
  defaultConfig: defaultConfig
};

