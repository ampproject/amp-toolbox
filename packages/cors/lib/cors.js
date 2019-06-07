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

const Caches = require('@ampproject/toolbox-cache-list');
const createCacheSubdomain = require('@ampproject/toolbox-cache-url').createCurlsSubdomain;
const log = require('@ampproject/toolbox-core').log.tag('AMP CORS');
const url = require('url');

// the default options
const DEFAULT_OPTIONS = {
  allowCredentials: true,
  enableAmpRedirectTo: true,
  sourceOriginPattern: false,
  verbose: false,
  verifyOrigin: true,
};

/**
 * Creates a middleware automatically adding AMP CORS headers to requests initiated by the AMP
 * runtime. See also https://www.ampproject.org/docs/fundamentals/amp-cors-requests.
 *
 * @param {Object} options
 * @param {RegExp} [options.sourceOriginPattern=false] regex matching allowed source origins
 * @param {boolean} [options.verbose=false] verbose logging output
 * @param {boolean} [options.verifyOrigin=true] verify origins to match official AMP caches.
 * @param {Caches} [caches=new Caches()]
 * @return {Function} next middleware function
 */
module.exports = (options, caches=new Caches()) => {
  options = Object.assign(DEFAULT_OPTIONS, options);
  log.verbose(options.verbose);
  return async (request, response, next) => {
    // Get source origin from query
    const sourceOrigin = url.parse(request.url, true).query.__amp_source_origin;
    if (!sourceOrigin) {
      // it's not an AMP CORS request
      next();
      return;
    }
    log.debug(request.method, request.url);

    // Check if sourceOrigin is allowed
    if (options.sourceOriginPattern && !options.sourceOriginPattern.test(sourceOrigin)) {
      response.status(403).end(); // forbidden
      log.debug('source origin does not match pattern', options.sourceOriginPattern, sourceOrigin);
      return;
    }

    // If neither AMP-SAME-ORIGIN nor Origin set are set, don't add any headers
    const originHeaders = extractOriginHeaders_(request.headers);
    if (!originHeaders) {
      log.warn('AMP-SAME-ORIGIN and Origin header missing');
      response.status(400).end(); // bad request
      return;
    }

    // Check if origin is a valid AMP cache
    if (originHeaders.origin &&
        options.verifyOrigin &&
        !await isValidOrigin(originHeaders.origin, sourceOrigin)) {
      log.warn('invalid Origin', originHeaders.origin);
      response.status(403).end(); // forbidden
      return;
    }
    // Add CORS and AMP CORS headers
    response.setHeader('Access-Control-Allow-Origin', originHeaders.origin || sourceOrigin);
    const headersToExpose = ['AMP-Access-Control-Allow-Source-Origin'];
    if (options.enableAmpRedirectTo) {
      headersToExpose.push('AMP-Redirect-To');
    }
    response.setHeader('Access-Control-Expose-Headers', headersToExpose);
    response.setHeader('AMP-Access-Control-Allow-Source-Origin', sourceOrigin);
    if (options.allowCredentials) {
      response.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    next();
  };

  /**
   * Extracts the `AMP-Same-Origin` and `Origin` header values.
   *
   * @param {Object} headers
   * @returns {Object} object containing the origin or isSameOrigin value
   * @private
   */
  function extractOriginHeaders_(headers) {
    const result = {
      isSameOrigin: false,
    };
    for (const key in headers) {
      if (headers.hasOwnProperty(key)) {
        const normalizedKey = key.toLowerCase();
        // for same-origin requests where the Origin header is missing, AMP sets the amp-same-origin header
        if (normalizedKey === 'amp-same-origin') {
          result.isSameOrigin = true;
          return result;
        }
        // use the origin header otherwise
        if (normalizedKey === 'origin') {
          result.origin = headers[key];
          return result;
        }
      }
    }
    return null;
  }

  /**
   * Checks whether the given origin is a valid AMP cache.
   *
   * @param {String} origin
   * @return {boolean} true if origin is valid
   * @private
   */
  async function isValidOrigin(origin, sourceOrigin) {
    // This will fetch the caches from https://cdn.ampproject.org/caches.json the first time it's
    // called. Subsequent calls will receive a cached version.
    const officialCacheList = await caches.list();
    // Calculate the cache specific origin
    const cacheSubdomain = `https://${await createCacheSubdomain(sourceOrigin)}.`;
    // Check all caches listed on ampproject.org
    for (const cache of officialCacheList) {
      const cachedOrigin = cacheSubdomain + cache.cacheDomain;
      if (origin === cachedOrigin) {
        return true;
      }
    }
    return false;
  }
};
