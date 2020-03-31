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

const {oneBehindFetch} = require('@ampproject/toolbox-core');
const CACHE_LIST_ENDPOINT = 'https://cdn.ampproject.org/caches.json';

let INSTANCE = null;

/**
 * List of known AMP Caches, as available at `https://cdn.ampproject.org/caches.json`.
 *
 */
class AmpCaches {
  static list() {
    if (!INSTANCE) {
      INSTANCE = new AmpCaches();
    }
    return INSTANCE.list();
  }
  static get(id) {
    if (!INSTANCE) {
      INSTANCE = new AmpCaches();
    }
    return INSTANCE.get(id);
  }

  /**
   * Creates a new instance of AmpCaches.
   *
   * @param {Function} fetch - a fetch implementation
   */
  constructor(fetch = oneBehindFetch) {
    this.fetch_ = fetch;
  }

  /**
   * Retrieves the list of Caches
   *
   * @returns {Promise<Array>} A promise that resolves to an array containing the cache objects.
   */
  async list() {
    const response = await this.fetch_(CACHE_LIST_ENDPOINT);
    const data = await response.json();
    return data.caches;
  }

  /**
   * Retrieves the cache instance that maches the cacheId.
   *
   * @param {string} cacheId The id of the cache to be retrieved.
   * @returns {Promise<object>} the Cache which the matching id or undefined, if a cache with the
   * id was not found.
   */
  async get(cacheId) {
    const caches = await this.list();
    return caches.find((cache) => cache.id === cacheId);
  }
}

/** @module AmpCaches */
module.exports = AmpCaches;
