<!---
Copyright 2018 The AMP HTML Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS-IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

## Introduction

The amp-ssr-express is an [express](http://expressjs.com/) middleware that is typically used by
developers who want to create a dynamic AMP website and take advantage of the performance boost
provided by server-side-rendered AMPs.

The middleware uses the [amp-ssr](../ssr) component to apply server-side-rendering on the fly.

## How it works

amp-ssr-express works by replacing the content rendered by the routes it is tied to by a version
of the content that has been transformed by [amp-ssr](../ssr).

As the server-side-rendered version of the content is ceases to be valid AMP, the component also
handles serving the original content on an alternative URL to which server-side-rendering
transformations are not applied. This alternative URL is used as the amphtml link of the
transformed version.

Example:

A valid AMP page is served on `https://example.com/index.html`.

When the amp-ssr-express middleware is used, that URL will serve the server-side-rendered of the
content.

The original, valid AMP will then become available at `https://example.com/index.html?amp=`, and
amphtml link will be added to the server-side-rendered version at `https://example.com/index.html`.

## Usage

Usage follows the standard for most Express middlewares. It is important that the middleware is
used *before* the middleware or route that renders the page.

The example bellow will transform HTML being loaded by express-static:

```javascript
const express = require('express');
const path = require('path');
const app = express();
const createAmpSsrMiddleware = require('amp-toolbox-ssr-express');
const ampSsr = require('amp-toolbox-ssr');

// Setup the AMP-SSR Transformer and pass along the path to build the link tag.
const ampSsrMiddleware = createAmpSsrMiddleware(ampSsr);

// It's important that the ampSsrMiddleware is added *before* the static middleware.
// This allows us to replace the parts needed before static handles the request.
app.use(ampSsrMiddleware);

const staticMiddleware = express.static(path.join(__dirname, '/public'));
app.use(staticMiddleware);
```

## Best Practice: Cache server-side-rendered AMPs

To achieve best performance, those transformations shouldn't be applied for
every request. Instead, transformations should only be applied the *first time*
a page is requested, and the results then cached. Caching can happen on the CDN
level, on the site's internal infrastructure (eg: Memcached), or even on the
server itself, if the set of pages is small enough to fit in memory.
