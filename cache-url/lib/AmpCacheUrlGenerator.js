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

const {URL} = require('url');
const constructCurlsDomain = require('./AmpCurlUrlGenerator'); 

/**
 * Translates the canonicalUrl to the AMP Cache equivalent, for a given AMP Cache.
 * Example:
 * createCacheUrl('cdn.ampproject.org', 'hello-world.com')
 * // Should resolve: 'https://hello--world-com.cdn.ampproject.org/c/s/hello-world.com'
 *
 * @param {string} domainSuffix the AMP Cache domain suffix
 * @param {string} url the canonical URL
 * @returns Promise
 */
function createCacheUrl(domainSuffix, url) {
  return new Promise((resolve, reject) => {

    const canonicalUrl = new URL(url);
    let pathSegment = _getResourcePath(canonicalUrl.pathname);
    pathSegment += canonicalUrl.protocol === 'https:' ? '/s/' : '/';

    constructCurlsDomain(canonicalUrl.toString()).then((curlsDomain) => {
      const cacheUrl = new URL(url);
      cacheUrl.protocol = 'https';
      cacheUrl.hostname = curlsDomain + '.' + domainSuffix;
      cacheUrl.pathname = pathSegment + canonicalUrl.hostname + canonicalUrl.pathname;
      resolve(cacheUrl.toString());
    }).catch((err) => {
      reject(err);
    });
  });
}

/**
 * Returns the AMP Cache path, based on the mime type of the file that is being loaded.
 * @param {string} pathname the pathname on the canonical url.
 */
function _getResourcePath(pathname) {

  // Require our font and image extensions
  // Requiring here to help tree shaking
  const imageExtensions = require('./ImageExtensions');
  const fontExtensions = require('./FontExtensions');

  if (imageExtensions.isPathNameAnImage(pathname)) {
    return '/i';
  }

  if (fileExtensions.isPathNameAFont(pathname)) {
    return '/r';
  }

  // Default to document
  return '/c';
}

/** @module AmpUrl */
module.exports = createCacheUrl;
