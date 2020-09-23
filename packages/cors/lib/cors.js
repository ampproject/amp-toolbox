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
const DEFAULT_OPTIONS = Object.freeze({
  allowCredentials: true,
  email: false,
  enableAmpRedirectTo: true,
  sourceOriginPattern: false,
  verbose: false,
  verifyOrigin: true,
});

/**
 * Creates a middleware automatically adding AMP CORS headers to requests initiated by the AMP
 * runtime. See also https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cors-requests/.
 *
 * @param {Object} options
 * @param {RegExp} [options.sourceOriginPattern=false] regex matching allowed source origins or sender emails
 * @param {boolean} [options.verbose=false] verbose logging output
 * @param {boolean} [options.email=false] add additional CORS headers for AMP for Email
 * @param {boolean} [options.verifyOrigin=true] verify origins to match official AMP caches.
 * @param {Caches} [caches=new Caches()]
 * @return {Function} next middleware function
 */
module.exports = (options, caches = new Caches()) => {
  options = Object.assign({}, DEFAULT_OPTIONS, options);
  log.verbose(options.verbose);
  if (options.email === true) {
    // email origins cannot be verified
    options.verifyOrigin = false;
    // email doesn't support AMP-Redirect-To
    options.enableAmpRedirectTo = false;
  }
  return async (request, response, next) => {
    const originHeaders = extractOriginHeaders_(request.headers);

    // Handle email case immediately, if detected
    if (options.email === true && originHeaders && originHeaders.emailSender) {
      const sender = originHeaders.emailSender;
      if (options.sourceOriginPattern && !options.sourceOriginPattern.test(sender)) {
        response.status(403).end(); // forbidden
        log.debug('email sender does not match pattern', options.sourceOriginPattern, sender);
        return;
      }
      response.setHeader('AMP-Email-Allow-Sender', sender);
      next();
      return;
    }

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
    if (!originHeaders) {
      log.warn('AMP-SAME-ORIGIN and Origin header missing');
      response.status(400).end(); // bad request
      return;
    }

    // Check if origin is a valid AMP cache
    if (
      originHeaders.origin &&
      options.verifyOrigin &&
      !(await isValidOrigin(originHeaders.origin, sourceOrigin))
    ) {
      log.warn('invalid Origin', originHeaders.origin);
      response.status(403).end(); // forbidden
      return;
    }
    // Add CORS and AMP CORS headers
    response.setHeader('Access-Control-Allow-Origin', originHeaders.origin || sourceOrigin);
    const headersToExpose = [];
    if (options.enableAmpRedirectTo) {
      headersToExpose.push('AMP-Redirect-To');
    }
    if (options.email) {
      headersToExpose.push('AMP-Access-Control-Allow-Source-Origin');
      response.setHeader('AMP-Access-Control-Allow-Source-Origin', sourceOrigin);
    }
    response.setHeader('Access-Control-Expose-Headers', headersToExpose);
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
    const normalizedHeaders = {};

    for (const key in headers) {
      normalizedHeaders[key.toLowerCase()] = headers[key];
    }

    if ('amp-email-sender' in normalizedHeaders) {
      // CORS for email (new version)
      return {
        emailSender: normalizedHeaders['amp-email-sender'],
      };
    } else if ('amp-same-origin' in normalizedHeaders) {
      // for same-origin requests AMP sets the amp-same-origin header
      return {
        isSameOrigin: true,
      };
    } else if ('origin' in normalizedHeaders) {
      // use the origin header otherwise
      return {
        isSameOrigin: false,
        origin: normalizedHeaders.origin,
      };
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
