## Introduction

`amp-toolbox-ssr` is a library for server-side-rendering AMP pages. This makes it possible to optimize
page loading times when serving AMP pages from a non-cache domain.

**Warning:** server-side rendered AMP files are no longer valid AMPHTML. Hence, serve-side rendered AMP pages should link to their [valid AMP counterpart](https://www.ampproject.org/docs/guides/discovery).

## Table of Contents

- [Introduction](#introduction)
- [Background](#background)
- [Usage](#usage)
  - [Options](#options)
- [Example](#example)
- [Best Practices](#best-practices)
  - [Transform AMP pages at build time if possible](#transform-amp-pages-at-build-time-if-possible)
  - [Cache transformed AMPs](#cache-transformed-amps)
- [Why is it faster?](#why-is-it-faster)
- [Caveats](#caveats)
- [Version History](#version-history)

## Background

The [Google AMP Cache](https://developers.google.com/amp/cache/overview#cache-optimizations-and-modifications) performs additional optimizations to make AMP pages load even faster. You can find out more about these optimizations [here](https://github.com/ampproject/amphtml/issues/7022) and [here](https://github.com/ampproject/amphtml/issues/8566). This project provides a Node.js based implementation of the same set of transformations performed by the Google AMP Cache. This serves two goals:

* Enable faster loading times for canonical AMP sites.
* Provide a reference implementation for other AMP caches.

## Usage

You can find a sample implementation [here](demo/simple/). If you're using the express middleware, please use the [AMP SSR middleware](../ssr-express).

Install via:

```
npm install amp-toolbox-ssr
```

Minimal usage:

```js
const ampSSR = require('amp-toolbox-ssr');

// Transformer expects a string (streams are not supported)
const originalHtml = `
<!doctype html>
<html ⚡>
...
`

// Additional options can be passed as the second argument
const ssrHtml = ampSSR.transformHtml(originalHtml, {
  ampUrl: 'canonical.amp.html'
});

console.log(ssrHtml);
```

Advanced usage configuring the applied transformations:

```js
const ampSSR = require('amp-toolbox-ssr');

// Configure the transformers to be used.
// otherwise a default configuration is used.
ampSSR.setConfig({
  transformers: [
    // Adds a link to the valid AMP version
    'AddAmpLink',
    // Applies server-side-rendering optimizations
    'ServerSideRendering',
    // Removes ⚡ or 'amp' from the html tag
    'RemoveAmpAttribute',
    // Removes the boilerplate
    // needs to run after ServerSideRendering
    'AmpBoilerplateTransformer',
    // Optimizes script import order 
    // needs to run after ServerSideRendering
    'ReorderHeadTransformer',
    // Adds pre-load statements and optionally versions AMP runtime URLs
    // needs to run after ReorderHeadTransformer
    'RewriteAmpUrls'
  ]
});

// Transformer expects a string (streams are not supported)
const originalHtml = `
<!doctype html>
<html ⚡>
...
`

// Additional options can be passed as the second argument
const ssrHtml = ampSSR.transformHtml(originalHtml, {
  ampUrl: 'canonical.amp.html'
});

console.log(ssrHtml);
```

You can find the currently supported transformations [here](lib/transformers). 

### Options

Currently the following options are supported:

* **ampUrl**: an URL string pointing to the valid AMP version. Required by the AddAmpLink transformer.
* **ampRuntimeVersion** specifies a
  [specific version](https://github.com/ampproject/amp-toolbox/tree/master/runtime-version") of the AMP runtime. For example: `ampRuntimeVersion: "001515617716922"` will result in AMP runtime URLs being re-written
  from `https://cdn.ampproject.org/v0.js` to
  `https://cdn.ampproject.org/rtv/001515617716922/v0.js<`.
* **ampUrlPrefix**: specifies an URL prefix for AMP runtime
  URLs. For example: `ampUrlPrefix: "/amp"` will result in AMP runtime
  URLs being re-written from `https://cdn.ampproject.org/v0.js` to
  `/amp/v0.js`.


## Example

The following valid AMPHTML:

```html
<!doctype html>
<html ⚡>
<head>
  <meta charset="utf-8">
  <link rel="canonical" href="canonical.html" />
  <meta name="viewport" content="width=device-width,minimum-scale=1">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-experiment" src="https://cdn.ampproject.org/v0/amp-experiment-0.1.js"></script>
  <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.1.js"></script>
  <style amp-custom>
    h1 {
      margin: 16px;
    }
  </style>
</head>
<body>
  <h1>Hello, AMP world!</h1>
  <amp-img width=360 heigh=200 layout=responsive src=image.png></amp-img>
</body>
</html>
```

Will be transformed to:

```html
<!DOCTYPE html>
<html i-amphtml-layout="" i-amphtml-no-boilerplate="">
<head>
  <style amp-runtime=""></style>
  <link rel="stylesheet" href="https://cdn.ampproject.org/v0.css">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,minimum-scale=1">
  <script async="" src="https://cdn.ampproject.org/v0.js"></script>
  <script async="" custom-element="amp-experiment" src="https://cdn.ampproject.org/v0/amp-experiment-0.1.js"></script>
  <script async="" custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.1.js"></script>
  <style amp-custom="">
    h1 {
      margin: 16px;
    }
  </style>
  <link rel="canonical" href="canonical.html">
  <link rel="amphtml" href="canonical.amp.html">
</head>
<body>
  <h1>Hello, AMP world!</h1>
  <amp-img width="360" heigh="200" layout="responsive" src="image.png" class="i-amphtml-layout-responsive i-amphtml-layout-size-defined" i-amphtml-layout="responsive"></amp-img>
</body>
</html>
```

A few notable changes are:

* The AMP attribute in the `html` tag gets removed as it's no longer valid AMP.
* The AMP boilerplate gets removed. Instead the `v0.css` is added.
* AMP layout classes are added to the `amp-img` extension.
* `<link rel="amphtml" href="canonical.amp.html">` gets added linking to the valid AMP version.

## Best Practices

### Transform AMP pages at build time if possible

Applying the transformations to an AMP file consumes additional server
resources. Also, since the entire file is needed to apply the transformations,
it also becomes impossible to stream the response while applying it.

In order to avoid server overhead, if the set of AMP files to be transformed is
known in advance, transformations should be run at build time.

### Cache transformed AMPs

Most websites have a more dynamic nature though and are not able to apply the
transformations statically. For such cases it is possible to run the
transformations after AMP pages are rendered, e.g. in an Express middleware.

To achieve best performance, those transformations shouldn't be applied for
every request. Instead, transformations should only be applied the *first time* 
a page is requested, and the results then cached. Caching can happen on the CDN
level, on the site's internal infrastructure (eg: Memcached), or even on the
server itself, if the set of pages is small enough to fit in memory. 

## Why is it faster?

In order to avoid Flash of Unstyled Content (FOUC) and reflows resulting from to the
usage of web-components, AMP requires websites to add the amp-boilerplate in the header.

The amp-boilerplate renders the page invisible by changing it's opacity, while
the fonts and the AMP Runtime load. Once the AMP runtime is loaded, it is able
to correctly set the sizes of the custom elements and once that happens, the
runtimes makes the page visible again.

As a consequence, the first render of the page doesn't happen until the AMP
Runtime is loaded.

To improve this, AMP server-side rendering applies the same rules as the
AMP Runtime on the server. This ensures that the reflow will not happen  and
the AMP boilerplate is no longer needed. The first render no longer depends on the 
AMP Runtime being loaded, which improves load times.

## Caveats

It's important to note that, even though the text content and layout will show
faster, content that depends on the custom AMP elements (eg: any element in
the page that starts with 'amp-') will only be visible after the AMP Runtime
is loaded.

