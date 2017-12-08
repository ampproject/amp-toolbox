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

const express = require('express');
const path = require('path');
const app = express();

const ampSSR = require('amp-toolbox-ssr');
ampSSR.setConfig({
  transformers: [
    'AddAmpLink',
    'ServerSideRendering',
    'RemoveAmpAttribute',
    // needs to run after ServerSideRendering
    'AmpBoilerplateTransformer',
    // needs to run after ServerSideRendering
    'ReorderHeadTransformer'
  ]
});

// The transform middleware replaces the `res.write` method so that, instead of sending
// the content to the network, it is accumulated in a buffer. `res.end` is also replaced
// so that, when it is invoked, the buffered response is transformed with AMP-SSR and sent
// to the network.
const createTransformMiddleware = options => {
  options.ampPath = options.ampPath || '/amp/';

  return (req, res, next) => {
    // This is a request for the original AMP. Allow the flow to continue normally.
    if (req.url.startsWith(options.ampPath)) {
      next();
      return;
    }

    req.url = path.join(options.ampPath, req.url);

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
      const transformedBody =
          ampSSR.transformHtml(body, {ampUrl: path.join(options.ampPath, req.originalUrl)});

      res.send(transformedBody);
    };

    next();
  };
};

// Setup the AMP-SSR Transformer and pass along the path to build the link tag.
const transformMiddleware = createTransformMiddleware({});

// It's important that the transformMiddleware is added BEFORE the static middleware.
// This allows us to replace the parts needed before static handles the request.
app.get('/*.html', transformMiddleware);

const staticMiddelware = express.static(path.join(__dirname, '/public'));
app.use(staticMiddelware);

const DEFAULT_PORT = 3000;
const port = process.env.PORT || DEFAULT_PORT;
app.listen(port, () => {
  console.log('Example app listening on port 3000!');
});
