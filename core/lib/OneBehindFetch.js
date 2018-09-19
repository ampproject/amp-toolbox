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

const axios = require('axios');
const MaxAge = require('./MaxAge.js');

/**
 * Implements fetch with a one-behind-caching strategy.
 */
class OneBehindFetch {
  /**
   * Creates a new OneBehindFetch.
   *
   * @returns {OneBehindFetch}
   */
  static create() {
    return new OneBehindFetch(axios);
  }

  /**
   * Creates a new OneBehindFetch.
   *
   * @param {Axios} axio request handler
   * @returns {OneBehindFetch}
   */
  constructor(axios) {
    this.cache_ = {};
    this.axios_ = axios;
  }

  /**
   * Performs a get request. Will always return the last cached value.
   *
   * @param {String} url request url
   * @returns {Promise<json>} a promise containing the JSON repsonse
   */
  get(url) {
    let response = this.cache_[url];
    if (!response) {
      response = {
        maxAge: MaxAge.zero(),
      };
      this.cache_[url] = response;
    }
    if (!response.maxAge.isExpired()) {
      return response.data;
    }
    const staleData = response.data;
    response.data = this.axios_.get(url)
        .then((fetchResponse) => {
          response.maxAge = MaxAge.parse(fetchResponse.headers['cache-control']);
          return fetchResponse.data;
        });
    return staleData || response.data;
  }
}

module.exports = OneBehindFetch;
