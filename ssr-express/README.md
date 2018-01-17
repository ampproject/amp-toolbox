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

amp-ssr-express is an [express](http://expressjs.com/) middleware that applies AMP server-side-rendering on the fly, using the [amp-ssr](../ssr) component.

For the middleware to work, a route that renders AMP pages must be available. It will then rewrite the
request to that route and apply server-side-rendering to the result.

As an example, a website that has an SSR page at `https://example.com/page.html` would have it's AMP
equivalent at the route `https://example.com/amp/page.html`. The middleware will intercept the original request to `/page.html` rewrite it to `/amp/page.html` and transform the output.

Requests made directly to the AMP page, such as `https://example.com/amp/page.html` will not have
server-side-rendering applied.

## Usage

Usage of this middleware follows the standard for most Express middlewares. It is important that the
middleware is used *before* the middleware or route that renders the page.

The example bellow will transform HTML being loaded by express-static:
```javascript
const transformMiddleware = createTransformMiddleware(ampSSR);
const staticMiddleware = express.static(path.join(__dirname, '/public'));

app.use(transformMiddleware);
app.use(staticMiddleware);
```

If `staticMiddleware` was used before `transformMiddleware`, the request would be finished after the first
finishes, and the page wouldn't have a change to be transformed.

### Using the default configuration

The default configuration uses the `/amp/` as the prefix for AMP pages. The two effects from this are:
- Pages which the pathname start with `/amp/` will not have the transformation applied.
eg: `https://example.com/amp/page.html`.
- Pages that do not start with `/amp/` will have the URL rewritten to the equivalent page by appending
the prefix to URL and the output will be transformed. eg: `https://example.com/page.html` is rewritten
to `https://example.com/amp/page.html`.

Example configuration using the default configuration and a static middleware:
```javascript
const express = require('express');
const path = require('path');
const app = express();
const createTransformMiddleware = require('amp-toolbox-ssr-express');
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

// Setup the AMP-SSR Transformer and pass along the path to build the link tag.
const transformMiddleware = createTransformMiddleware(ampSSR);

// It's important that the transformMiddleware is added BEFORE the static middleware.
// This allows us to replace the parts needed before static handles the request.
app.use(transformMiddleware);

const staticMiddleware = express.static(path.join(__dirname, '/public'));
app.use(staticMiddleware);
```

### Using a custom configuration
For developers who want to use a different URL scheme than prefixing the AMP files with
`/amp`, it is possible to add a configuration with custom methods to decide if a page
should be transformed and to transform an URL to the AMP equivalent.

The example bellow transforms uses the `?amp` query parameter to indicate pages that are
AMPs. eg: `https://example.com/page.html` becomes `https://example.com/page.html?amp`.

```javascript
// skipTransform receives a `string` containing an url as parameter, and returns a `boolean`.
const skipTransform = url => {
  // http://example.com is used as the second parameter,
  // as the URL constructor requires a valid domain.
  const parsedUrl = new URL(url, 'https://example.com');
  return parsedUrl.searchParams.has('amp');
};

// ampUrl receives a `string` containing an url as parameter, and returns a `string` indicating
// the equivalent AMP url.
const ampUrl = url => {
  // http://example.com is used as the second parameter,
  // as the URL constructor requires a valid domain.
  const parsedUrl = new URL(url, 'https://example.com');
  parsedUrl.searchParams.set('amp', '');
  return parsedUrl.pathname + parsedUrl.search;
};

// Setup the AMP-SSR Transformer and pass along the path to build the link tag.
const transformMiddleware = createTransformMiddleware(ampSSR, {
    skipTransform: skipTransform,
    ampUrl: ampUrl
});

// It's important that the transformMiddleware is added BEFORE the static middleware.
// This allows us to replace the parts needed before static handles the request.
app.use(transformMiddleware);
```
## Cache server-side-rendered AMPs

To achieve best performance, those transformations shouldn't be applied for
every request. Instead, transformations should only be applied the *first time*
a page is requested, and the results then cached. Caching can happen on the CDN
level, on the site's internal infrastructure (eg: Memcached), or even on the
server itself, if the set of pages is small enough to fit in memory.

