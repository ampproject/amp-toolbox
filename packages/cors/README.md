# AMP CORS Middleware

A node middleware that automatically adds
[AMP CORS](https://www.ampproject.org/docs/fundamentals/amp-cors-requests) headers to outgoing
requests. These headers will only be added if

## Installation

Install via:

```sh
npm install amp-toolbox-cors --save
```

## Usage

The AMP CORS middleware adds CORS and AMP CORS headers to all CORS requests initiated by the AMP runtime. These 
requests are identified by the `__amp_source_origin` query parameter. All other requests remain
unchanged:

```js
const express = require('express');
const ampCors = require('amp-toolbox-cors');

const app = express();

// That's it!
app.use(ampCors());
...
```

You can additionally filter requests by source origin. For example:

```
app.use(ampCors({
  sourceOriginPattern: /https:\/\/ampbyexample\.com$/
}));
```

This will only allow requests from `https://ampbyexample.com`. Requests from all other origins
will receive a `403` response,

