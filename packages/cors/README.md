# AMP CORS Middleware

[![npm version](https://badge.fury.io/js/amp-toolbox-cors.svg)](https://badge.fury.io/js/amp-toolbox-cors)

The AMP CORS middleware adds CORS and
[AMP CORS](https://www.ampproject.org/docs/fundamentals/amp-cors-requests) headers to all CORS
requests initiated by the AMP runtime. The middleware will only add these headers if the
`__amp_source_origin` query parameter is present. All other requests remain unchanged.

## Installation

Install via:

```sh
npm install amp-toolbox-cors --save
```

## Usage

Here is an example using [Express](https://expressjs.com):

```js
const express = require('express');
const ampCors = require('@ampproject/toolbox-cors');

const app = express();

// That's it!
app.use(ampCors());
...
```

Please note that AMP CORS does not depend on Express and is based on Node's HTTP Request and
Response objects.

### Filtering by source origin

You can additionally filter requests by source origin. For example:

```
app.use(ampCors({
  sourceOriginPattern: /https:\/\/ampbyexample\.com$/
}));
```

This will only allow requests with `https://ampbyexample.com` set as the source origin. Requests from all other origins
will receive a `403` response,

### Origin verification

By default, the AMP CORS middleware will only allow requests from AMP Caches listed on
https://cdn.ampproject.org/caches.json (with the addition of `bing-amp.com`). All other
origins will receive a `403` response. To allow requests from all origins, disable this
via the `verifyOrigin` option:

```
app.use(ampCors({
  verifyOrigin: false
}));
```

### Allow Crendentials 

By default, the AMP CORS middleware will allow [crendentials mode](https://fetch.spec.whatwg.org/#concept-request-credentials-mode) for AMP CORS requests.
To disable this, set `allowCredentials` to `false`. 

```
app.use(ampCors({
  allowCredentials: false
}));
// => will not set "Access-Control-Allow-Credentials", "true"
```

### Allow AMP-Redirect-To 

By default, the AMP CORS middleware will allow redirects via [AMP-Redirect-To](https://www.ampproject.org/docs/reference/components/amp-form#redirecting-after-a-submission). To disable this, set `enableAmpRedirectTo` to `false`. 

```
app.use(ampCors({
  enableAmpRedirectTo: false
}));
// => Access-Control-Expose-Headers: AMP-Access-Control-Allow-Source-Origin instead of 
// Access-Control-Expose-Headers: AMP-Access-Control-Allow-Source-Origin, AMP-Redirect-To
```

### Logging

For debugging requests, you can enable the verbose loggin mode via the `verbose` option:

```
app.use(ampCors({
  verbose: false
}));
```

## Example

See [express.js](demo/express.js) for a sample implementation. There are two scenarios in which the AMP CORS header will be added:

1. AMP CORS header will be set if the `__amp_source_origin` query parameter is set together with the `AMP-SAME-ORIGIN` header:

```
$ curl --header "AMP-SAME-ORIGIN: true" -I "http://localhost:3000/items?__amp_source_origin=https://localhost:3000"
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: https://localhost:3000
Access-Control-Expose-Headers: AMP-Access-Control-Allow-Source-Origin
AMP-Access-Control-Allow-Source-Origin: https://localhost:3000
Content-Type: application/json; charset=utf-8
...
```

2. AMP CORS header will be set if the `__amp_source_origin` query parameter is set together with the `Origin` header:

```
$ curl --header "Origin: https://ampbyexample-com.cdn.ampproject.org" -I "http://localhost:3000/items?__amp_source_origin=https://localhost:3000"
HTTP/1.1 200 OK
X-Powered-By: Express
Access-Control-Allow-Origin: https://ampbyexample-com.cdn.ampproject.org
Access-Control-Expose-Headers: AMP-Access-Control-Allow-Source-Origin
AMP-Access-Control-Allow-Source-Origin: https://localhost:3000
Content-Type: application/json; charset=utf-8
...
```

In all other cases, no CORS header will be set.

```
$ curl -I localhost:3000/items
HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
...
```
