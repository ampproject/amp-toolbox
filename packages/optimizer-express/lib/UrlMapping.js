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

const URL = require('url');
const {URLSearchParams} = require('whatwg-url');

/**
 * Handles the mapping between the canonical URLs and the AMP URLs.
 */
class UrlMapping {
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
    const parsedUrl = URL.parse(url);
    const searchParams = this.parseUrlSearchParams_(parsedUrl);
    return searchParams.has(this.prefix_);
  }

  /**
   * Given a canonical URL, transforms it to the AMP equivalent.
   *
   * @param {string} canonicalUrl the canonical URL
   * @returns {string} the equivalent AMP url for that page.
   */
  toAmpUrl(canonicalUrl) {
    const parsedUrl = URL.parse(canonicalUrl);
    const searchParams = this.parseUrlSearchParams_(parsedUrl);
    searchParams.set(this.prefix_, '1');
    return this.formatUrl_(parsedUrl, searchParams);
  }

  /**
   * Given an AMP URL, returns the canonical equivalent
   *
   * @param {string} ampUrl the AMP URL
   * @returns {string} the equivalent canonical URL for the AMP page.
   */
  toCanonicalUrl(ampUrl) {
    const parsedUrl = URL.parse(ampUrl);
    const searchParams = this.parseUrlSearchParams_(parsedUrl);
    searchParams.delete(this.prefix_);
    return this.formatUrl_(parsedUrl, searchParams);
  }

  formatUrl_(parsedUrl, searchParams) {
    parsedUrl.search = searchParams.toString();
    return URL.format(parsedUrl);
  }

  parseUrlSearchParams_(parsedUrl) {
    return new URLSearchParams(parsedUrl.search || '');
  }
}

module.exports = UrlMapping;
