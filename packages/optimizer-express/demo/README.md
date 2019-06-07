# toolbox-optimizer-express-demo

Contains a set of examples on how to use the AMP Optimizer Express Middleware.

## simple

Demonstrates the simplest usage of the middleware. 

Usage:

```sh
node simple.js
```

## Runtime Version

Demonstrates how to use enable versioned URLs for the AMP Runtime when using the Middleware.

Usage:

```sh
node runtimeVersion.js
```

## Proxy

Uses the `http-proxy` library to implement a proxy server that reads valid AMPs from an origin
and serves an optimized version.

Usage:

```sh
node proxy.js https://www.ampbyexample.com
```
