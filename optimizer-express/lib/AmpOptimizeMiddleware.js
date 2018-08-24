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
 * so that, when it is invoked, the buffered response is transformed with AMP Optimizer and sent
 * to the network.
 */
const mime = require('mime-types');
const UrlMapping = require('./UrlMapping');
const ampOptimizer = require('amp-toolbox-optimizer');

const DEFAULT_URL_MAPPING = new UrlMapping('amp');

class AmpOptimizerMiddleware {
  /**
   * @function runtimeVersion A function used to provide the runtimeVersion when applying the
   * optimizer transformations.
   * @returns {Promise<string>} A promise that resolves to the runtime version.
   */

  /**
   * Creates a new amp-server-side-rendering middleware, using the specified
   * ampOptimizer and options.
   *
   * @param {Object} options an optional object containing custom configurations for
   * the middleware.
   * @param {ampOptimizer} options.ampOptimizer the ampOptimizer used to apply server-side render transformations.
   * @param {UrlMapping} options.urlMapping The mapper to be used when checking for AMP pages,
   * rewriting to * canonical and generating amphtml links.
   * @param {runtimeVersion} options.runtimeVersion a function used to generate the runtimeVersion,
   *  to be passed to ampOptimizer.
   */
  static create(options) {
    options = options || {};
    const urlMapping = options.urlMapping || DEFAULT_URL_MAPPING;
    const optimizer = options.ampOptimizer || ampOptimizer;
    const runtimeVersion = options.runtimeVersion || (() => Promise.resolve(null));

    return (req, res, next) => {
      // If this is a request for a resource, such as image, JS or CSS, do not apply optimizations.
      if (AmpOptimizerMiddleware.isResourceRequest_(req)) {
        next();
        return;
      }

      // This is a request for the AMP URL, rewrite to canonical URL, and do apply optimizations.
      if (urlMapping.isAmpUrl(req.url)) {
        req.url = urlMapping.toCanonicalUrl(req.url);
        next();
        return;
      }

      // This is a request for the canonical URL. Setup the middelware to transform the
      // response using amp-optimizer.
      const chunks = [];

      // We need to store the original versions of those methods, as we need to invoke
      // them to finish the request correctly.
      const originalEnd = res.end;
      const originalWrite = res.write;
      const originalWriteHead = res.writeHead;

      // We need to postpone writeHead, as it flushes the request headers to the client, and we
      // need to update the Content-Length with the size of the server side rendered AMP.
      res.writeHead = (statusCode, statusMessage, headers) => {
        res.status(statusCode);
        res.set(headers);
      };

      res.write = (chunk) => {
        chunks.push(chunk);
      };

      res.end = (chunk) => {
        // Replace methods with the original implementation.
        res.write = originalWrite;
        res.end = originalEnd;
        res.writeHead = originalWriteHead;

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

        // This is a request for the canonical URL. Generate the AMP equivalent
        // in order to add it to the link rel tag.
        const linkRelAmpHtmlUrl = urlMapping.toAmpUrl(req.url);

        runtimeVersion()
          .catch((err) => {
            console.error('Error retrieving ampRuntimeVersion: ', err);
            return null;
          })
          .then((version) => {
            const ampOptimizerParams = req.ampOptimizerParams || {};
            ampOptimizerParams.ampUrl = linkRelAmpHtmlUrl;
            ampOptimizerParams.ampRuntimeVersion = version;
            return optimizer.transformHtml(body, ampOptimizerParams);
          })
          .then((transformedBody) => {
            res.setHeader('Content-Length', Buffer.byteLength(transformedBody, 'utf-8'));
            res.end(transformedBody, 'utf-8');
          })
          .catch((err) => {
            console.error('Error applying AMP Optimizer. Sending original page', err);
            res.end(body);
          });
      };

      next();
    };
  }

  /**
   * Returns true if the request is for a resource request, such as a request for an image,
   * Javascript or CSS file.
   *
   * @param {Request} req the request to be checked.
   * @returns {boolean} true if the reqeust is for a resource.
   */
  static isResourceRequest_(req) {
    // Checks if mime-type for request is text/html. If mime type is unknown, assume text/html,
    // as it is probably a directory request.
    const mimeType = mime.lookup(req.url) || 'text/html';
    return (req.accepts && req.accepts('html') !== 'html') ||
       mimeType !== 'text/html' &&
       !req.url.endsWith('/'); // adjust for /abc.com/, which return application/x-msdownload
  }
}

module.exports = AmpOptimizerMiddleware;
