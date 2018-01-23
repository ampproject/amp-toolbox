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

const {OneBehindFetch} = require('amp-toolbox-core');
const CACHE_LIST_ENDPOINT = 'https://cdn.ampproject.org/caches.json';

/**
 * List of known AMP Caches, as available at `https://cdn.ampproject.org/caches.json`.
 *
 */
class AmpCaches {
  /**
   * Creates a new instance of AmpCaches.
   *
   * @param {Object} [fetchStrategy = OneBehindFetch] The fetch strategy to be used when fetching
   * data from the caches endpoint. Defaults to OneBehindFetch.
   */
  constructor(fetchStrategy = OneBehindFetch.create()) {
    this.fetchStrategy_ = fetchStrategy;
  }

  /**
   * Retrieves the list of Caches
   *
   * @returns {Promise<Array>} A promise that resolves to an array containing the cache objects.
   */
  list() {
    return this.getCaches_();
  }

  /**
   * Retrieves the cache instance that maches the cacheId.
   *
   * @param {string} cacheId The id of the cache to be retrieved.
   * @returns {Promise<object>} the Cache which the matching id or undefined, if a cache with the
   * id was not found.
   */
  get(cacheId) {
    return this.list()
      .then(caches => caches.find(cache => cache.id === cacheId));
  }

  getCaches_() {
    return this.fetchStrategy_.get(CACHE_LIST_ENDPOINT)
      .then(json => json.caches);
  }
}

/** @module AmpCaches */
module.exports = AmpCaches;
