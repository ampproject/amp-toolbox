## Introduction

[![npm version](https://badge.fury.io/js/%40ampproject%2Ftoolbox-optimizer-express.svg)](https://badge.fury.io/js/%40ampproject%2Ftoolbox-optimizer-express)

amp-optimizer-express is an [express](http://expressjs.com/) middleware that optimizes page load
times for websites using AMP for their canonical pages. The middleware uses the same
server-side-rendering optimizations as the Google AMP Cache.

The middleware uses the [amp-optimizer](/packages/optimizer) component to apply server-side-rendering on the fly.

## How it works

amp-optimizer-express intercepts the responses and replaces their content with a version that has been
transformed by [amp-optimizer](/packages/optimizer).

As the server-side-rendered version of the content is not valid AMP, the component also
provides the original content on an alternative URL. Server-side-rendering
transformations are not applied to this URL, and the original valid AMP is served.

An AMPHTML link tag is added to the server-side-rendered version, linking it to the original valid
AMP version hosted on the alternative URL.

Example:

A valid AMP page is served on `https://example.com/index.html`.

When the amp-optimizer-express middleware is used, that URL will serve the server-side-rendered version
of the content.

The original, valid AMP will then become available at `https://example.com/index.html?amp`.

An amphtml link will be added to the server-side-rendered version:

```html
<link rel="amphtml" href="https://example.com/index.html?amp">
```

## Usage

Install via:

```
$ npm install @ampproject/toolbox-optimizer-express
```

The AMP Optimizer Middleware can be used like any other express middleware.

It is important that the middleware is used *before* the middleware or route that renders the page.

The example bellow will transform HTML being loaded by express-static:

```javascript
const express = require('express');
const path = require('path');
const app = express();
const AmpOptimizerMiddleware = require('@ampproject/toolbox-optimizer-express');

// It's important that the AmpOptimizerMiddleware is added *before* the static middleware.
// This allows us to replace the parts needed before static handles the request.
app.use(AmpOptimizerMiddleware.create());

const staticMiddleware = express.static(path.join(__dirname, '/public'));
app.use(staticMiddleware);
```

## Options

The following options are supported:

   * `runtimeVersion`: true if the optimizer should use versioned runtime imports (default is false).
   * `ampOnly`: true if the optimizer should only be applied to AMP files (indicated by the lightning bolt in the header).

Example:

```
app.use(AmpOptimizerMiddleware.create({
  runtimeVersion: true
});
```

## Best Practice: Cache server-side-rendered AMPs

To achieve best performance, those transformations shouldn't be applied for
every request. Instead, transformations should only be applied the *first time*
a page is requested, and the results then cached. Caching can happen on the CDN
level, on the site's internal infrastructure (e.g.: Memcached), or even on the
server itself, if the set of pages is small enough to fit in memory.
