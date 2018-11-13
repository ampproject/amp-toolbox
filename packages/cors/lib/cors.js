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

/**
 * Adds AMP CORS headers.
 *
 * See also https://www.ampproject.org/docs/fundamentals/amp-cors-requests
 *
 * @param {Object} options
 * @param {RegExp} options.sourceOriginPattern
 * @return {Function} middleware function
 */
module.exports = (options) => {
  return (request, response, next) => {
    // Get source origin from query
    const sourceOrigin = request.query.__amp_source_origin;
    if (!sourceOrigin) {
      // it's not an AMP CORS request
      next();
      return;
    }
    // Check if sourceOrigin is allowed
    if (options.sourceOriginPattern && !options.sourceOriginPattern.test(sourceOrigin)) {
      response.status(403).end(); // forbidden
      return;
    }
    // Get either the source origin or the cache origin
    const origin = calculateOrigin_(request.headers, sourceOrigin);
    // Add CORS and AMP CORS headers
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Expose-Headers', ['AMP-Access-Control-Allow-Source-Origin']);
    response.setHeader('AMP-Access-Control-Allow-Source-Origin', sourceOrigin);
    next();
  };
};


/**
 * Calculates the origin. For same-origin requests where the Origin header is missing, AMP sets
 * the following custom header: `AMP-Same-Origin: true`. Use `sourceOrigin` as origin in that case.
 * Otherwise, return the value of the`Origin`.
 *
 * @param headers
 * @param sourceOrigin the source origin set by the AMP runtime
 * @returns {String} the calculated origin
 */
function calculateOrigin_(headers, sourceOrigin) {
  for (const key in headers) {
    if (headers.hasOwnProperty(key)) {
      const normalizedKey = key.toLowerCase();
      // for same-origin requests where the Origin header is missing, AMP sets the amp-same-origin header
      if (normalizedKey === 'amp-same-origin') {
        return sourceOrigin;
      }
      // use the origin header otherwise
      if (normalizedKey === 'origin') {
        return headers[key];
      }
    }
  }
  return '';
}
