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

const {URL} = require('whatwg-url');

/**
 * When applying server-side-render AMPs, the resulting pages need to be linked to
 * AMP equivalents.
 */
class AmpSsrUrlScheme {
  constructor(prefix) {
    this.prefix_ = prefix;
  }
  /**
   * This method checks if a given URL is a canonical page and
   * should be transformed, or if it should be served as a valid AMP.
   *
   * @param {string} url to be checked if it is AMP.
   * @returns {boolean} true, if the url is an AMP url.
   */
  isAmpUrl(url) {
    // http://example.com is used as the second parameter,
    // as the URL constructor requires a valid domain.
    const parsedUrl = new URL(url, 'https://example.com');
    return parsedUrl.searchParams.has(this.prefix_);
  }

  /**
   * Given a canonical URL, transforms it to the AMP equivalent.
   *
   * @param {string} canonicalUrl the canonical URL
   * @returns {string} the equivalent AMP url for that page.
   */
  toAmpUrl(canonicalUrl) {
    // http://example.com is used as the second parameter,
    // as the URL constructor requires a valid domain.
    const parsedUrl = new URL(canonicalUrl, 'https://example.com');
    parsedUrl.searchParams.set(this.prefix_, '');
    return parsedUrl.pathname + parsedUrl.search;
  }

  /**
   * Given an AMP URL, returns the Canonical equivalent
   *
   * @param {string} ampUrl the AMP URL
   * @returns {string} the equivalent Canonical URL for the AMP page.
   */
  toCanonicalUrl(ampUrl) {
    // http://example.com is used as the second parameter,
    // as the URL constructor requires a valid domain.
    const parsedUrl = new URL(ampUrl, 'https://example.com');
    parsedUrl.searchParams.delete(this.prefix_);
    return parsedUrl.pathname + parsedUrl.search;
  }
}

module.exports = AmpSsrUrlScheme;
