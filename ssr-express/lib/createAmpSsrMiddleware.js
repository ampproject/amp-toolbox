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

/**
 * The transform middleware replaces the `res.write` method so that, instead of sending
 * the content to the network, it is accumulated in a buffer. `res.end` is also replaced
 * so that, when it is invoked, the buffered response is transformed with AMP-SSR and sent
 * to the network.
 */

const mime = require('mime-types');
const AmpSsrUrlScheme = require('./AmpSsrUrlScheme.js');

const DEFAULT_URL_SCHEME = new AmpSsrUrlScheme('amp');

/**
 * Creates a new amp-server-side-rendering middleware, using the specified
 * ampSSR and options.
 *
 * @param {string} ampSsr the ampSsr instance to be used by this transformer.
 * @param {Object} options an optional object containing custom configurations for
 * the middleware.
 * @param {AmpSsrUrlScheme} options.ampSsrUrlScheme The scheme to be used when checking
 * for AMP pages, rewriting to Canonical and generating amphtml links.
 */
const createAmpSsrMiddleware = (ampSsr, options) => {
  options = options || {};
  const ampSsrUrlScheme = options.ampSsrUrlScheme || DEFAULT_URL_SCHEME;

  return (req, res, next) => {
    // Checks if mime-type for request is text/html. If mime type is unknown, assume text/html,
    // as it is probably a directory request.
    const mimeType = mime.lookup(req.url) || 'text/html';
    if (req.accepts('html') !== 'html' || mimeType !== 'text/html') {
      next();
      return;
    }

    // This is a request for the AMP url, rewrite to canonical URL, and do apply SSR.
    if (ampSsrUrlScheme.isAmpUrl(req.url)) {
      req.url = ampSsrUrlScheme.toCanonicalUrl(req.url);
      next();
      return;
    }

    // This is a request for the Canonical URL. Setup the middelware to transform the
    // response using amp-ssr.
    const chunks = [];

    // We need to store the original versions of those methods, as we need to invoke
    // them to finish the request correctly.
    const originalEnd = res.end;
    const originalWrite = res.write;

    res.write = chunk => {
      chunks.push(chunk);
    };

    res.end = chunk => {
      // Replace methods with the original implementation.
      res.write = originalWrite;
      res.end = originalEnd;

      if (chunk) {
        // When an error (eg: 404) happens, express-static sends a string with
        // the error message on this chunk. If that's the case,
        // just pass forward the call to end.
        if (typeof chunk === 'string') {
          res.end(chunk);
          return;
        }
        chunks.push(chunk);
      }

      // If end is called withouth any chunks, end the request.
      if (chunks.length === 0) {
        res.end();
        return;
      }

      const body = Buffer.concat(chunks).toString('utf8');

      // This is a request for the Canonical URL. Generate the AMP equivalent
      // in order to add it to the link rel tag.
      const linkRelAmpHtmlUrl = ampSsrUrlScheme.toAmpUrl(req.url);
      const transformedBody = ampSsr.transformHtml(body, {ampUrl: linkRelAmpHtmlUrl});
      res.send(transformedBody);
    };

    next();
  };
};

module.exports = createAmpSsrMiddleware;
