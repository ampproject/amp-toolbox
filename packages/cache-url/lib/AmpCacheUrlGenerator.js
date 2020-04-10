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

import imageExtensions from './ImageExtensions';
import fontExtensions from './FontExtensions';
import createCurlsSubdomain from './AmpCurlUrlGenerator';
import Url from 'url-parse';

/**
 * @enum {string}
 */
const ServingTypes = {
  CONTENT: 'content',
  VIEWER: 'viewer',
  WEB_PACKAGE: 'web_package',
  CERTIFICATE: 'certificate',
  IMAGE: 'image',
};

/**
 * Translates the canonicalUrl to the AMP Cache equivalent, for a given AMP Cache.
 * Example:
 * createCacheUrl('cdn.ampproject.org', 'https://hello-world.com')
 * Should resolve: 'https://hello--world-com.cdn.ampproject.org/c/s/hello-world.com'
 *
 * @param {string} domainSuffix the AMP Cache domain suffix
 * @param {string} url the canonical URL
 * @param {?ServingTypes=} servingType AMP Cache serving type. e.g. viewer, content...
 * @return {!Promise<string>} The converted AMP cache URL
 */
function createCacheUrl(domainSuffix, url, servingType = null) {
  const canonicalUrl = new Url(url);
  let pathSegment = _getResourcePath(canonicalUrl.pathname, servingType);
  pathSegment += canonicalUrl.protocol === 'https:' ? '/s/' : '/';

  return createCurlsSubdomain(canonicalUrl.toString()).then((curlsSubdomain) => {
    const cacheUrl = new Url(url);
    cacheUrl.protocol = 'https';
    const hostname = curlsSubdomain + '.' + domainSuffix;
    cacheUrl.host = hostname;
    cacheUrl.hostname = hostname;
    cacheUrl.pathname = pathSegment + canonicalUrl.hostname + canonicalUrl.pathname;
    return cacheUrl.toString();
  });
}

/**
 * Returns the AMP Cache path, based on the mime type of the file that is being loaded.
 * @param {string} pathname the pathname on the canonical url.
 * @param {?ServingTypes=} servingType AMP Cache serving type. e.g. viewer, content...
 */
function _getResourcePath(pathname, servingType = null) {
  if (imageExtensions.isPathNameAnImage(pathname)) {
    return '/i';
  }

  if (fontExtensions.isPathNameAFont(pathname)) {
    return '/r';
  }

  if (servingType === ServingTypes.VIEWER) {
    return '/v';
  }

  // Default to document
  return '/c';
}

/** @module AmpUrl */
export default createCacheUrl;
