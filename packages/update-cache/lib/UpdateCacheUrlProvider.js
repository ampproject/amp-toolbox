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

const {createCacheUrl} = require('@ampproject/toolbox-cache-url');
const Signature = require('./Signature');
const Caches = require('@ampproject/toolbox-cache-list');

const {URL} = require('url');

/**
 * Generates update-cache URLs, according to the specification available at:
 * https://developers.google.com/amp/cache/update-ping#update-cache-request
 */
class UpdateCacheUrlProvider {
  constructor(signature, caches) {
    this._caches = caches;
    this._sig = signature;
  }

  /**
   * Generates update-cache URLs for each known AMP cache.
   *
   * @param {string} originUrl the URL for the content on the origin (ex: https://example.com)
   * @param {Number} [timestamp] as a UNIX Epoch in seconds
   * @returns {Promise<Array<Object>>} an array with objects containing the cache ID, cache name and
   * update-cache url.
   */
  calculateFromOriginUrl(originUrl, timestamp = defaultTimestamp_()) {
    return this._caches.list().then((caches) =>
      Promise.all(
        caches.map((cache) =>
          createCacheUrl(cache.updateCacheApiDomainSuffix, originUrl)
            .then((cacheUrl) => this.calculateFromCacheUrl(cacheUrl, timestamp))
            .then((updateCacheUrl) => {
              return {
                cacheId: cache.id,
                cacheName: cache.name,
                updateCacheUrl: updateCacheUrl,
              };
            })
        )
      )
    );
  }

  /**
   * Generates a signed update-cache request URL from an the AMP Cache URL, as documented here:
   * https://developers.google.com/amp/cache/update-ping#update-cache-request
   *
   * @param {String} cacheUrl the URL for the content on an AMP Cache
   * (eg: https://example_com.cdn.ampproject.org/example.com/)
   * @param {Number} [timestamp] as a UNIX Epoch in seconds
   * @return {Promise<String>} the signed update-cache URL.
   */
  calculateFromCacheUrl(cacheUrl, timestamp = defaultTimestamp_()) {
    const url = new URL(cacheUrl);

    // Create the Cache Refresh URL to be signed.
    url.pathname = '/update-cache' + url.pathname;
    url.searchParams.append('amp_action', 'flush');
    url.searchParams.append('amp_ts', timestamp);

    // Append the signature to the Cache Refresh Url.
    const urlSignature = this._sig.generate(url.pathname + url.search);
    url.searchParams.append('amp_url_signature', urlSignature);
    return Promise.resolve(url.toString());
  }

  /**
   * Creates an instance of UpdateCacheUrlProvider that uses the privateKey
   * to sign the Urls.
   *
   * @param {string} privateKey Private Key to be used when signing Urls.
   * @returns {UpdateCacheUrlProvider} an instance of UpdateCacheUrlProvider.
   */
  static create(privateKey) {
    const signature = new Signature(privateKey);
    const caches = new Caches();
    return new UpdateCacheUrlProvider(signature, caches);
  }
}

function defaultTimestamp_() {
  return (Date.now() / 1000) | 0;
}

/** @module UpdateCacheUrlProvider */
module.exports = UpdateCacheUrlProvider;
