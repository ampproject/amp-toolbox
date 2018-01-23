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

class AmpCaches {
  constructor(fetchStrategy = OneBehindFetch.create()) {
    this.fetchStrategy_ = fetchStrategy;
  }

  list() {
    return this.getCaches_();
  }

  async get(cacheName) {
    const caches = await this.list();
    return caches.find(cache => cache.id === cacheName);
  }

  async getCaches_() {
    const json = await this.fetchStrategy_.get(CACHE_LIST_ENDPOINT);
    return json.caches;
  }
}

module.exports = AmpCaches;
