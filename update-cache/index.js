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

const UpdateCacheUrlFactory = require('./lib/UpdateCacheUrlFactory');
const Signature = require('./lib/Signature');
const Caches = require('amp-toolbox-cache-list');

/**
 * Creates an instance of UpdateCacheUrlFactory that uses the privateKey
 * to sign the Urls.
 *
 * @param {string} privateKey Private Key to be used when signing Urls.
 * @returns {UpdateCacheUrlFactory} an instance of UpdateCacheUrlFactory.
 */
function createUpdateCacheUrlFactory(privateKey) {
  const signature = new Signature(privateKey);
  const caches = new Caches();
  return new UpdateCacheUrlFactory(signature, caches);
}

/** @module createUpdateCacheUrlFactory */
module.exports = createUpdateCacheUrlFactory;

