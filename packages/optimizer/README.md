# AMP Optimizer 

[![npm version](https://badge.fury.io/js/@ampproject/toolbox-optimizer.svg)](https://badge.fury.io/js/@ampproject/toolbox-optimizer)

AMP Optimizer is a tool to server-side enhance the rendering performance of AMP pages. AMP Optimizer implements [AMP performance best practices](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/optimize_amp?format=websites) and supports [AMP server-side-rendering](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/server-side-rendering?format=websites). By default, it will perform the following optimizations:

* Server-side render AMP layouts.
* Remove the AMP boilerplate (when possible).
* Inline critical CSS.
* Speed-up AMP framework and custom font loading.
* Move CSS keyframe animations to the bottom of the page.

The performance optimizations can improve page rendering times by up to 50%. You can read more about the potential performance gains in this [blog post](https://blog.amp.dev/2018/10/08/how-to-make-amp-even-faster/).

**Important: AMP Optimizer will produce valid AMP, if the input is valid AMP.**

* [Usage](#usage)
* [Best Practices](#best-practices)
  + [Regenerate pages at least once a week](#regenerate-pages-at-least-once-a-week)
  + [Debugging](#debugging)
  + [Transform AMP pages at build time if possible](#transform-amp-pages-at-build-time-if-possible)
  + [Cache transformed AMPs at runtime](#cache-transformed-amps-at-runtime)
* [Experimental Features](#experimental-features)
  + [Paired AMP](#paired-amp)
  + [Versioned AMP Runtime](#versioned-amp-runtime)
  + [Blurry image placeholders](#blurry-image-placeholders)
  + [Self-hosted AMP components](#self-hosted-amp-components)

## Usage

Install via:

```
npm install @ampproject/toolbox-optimizer
```

Minimal usage:

```js
const AmpOptimizer = require('@ampproject/toolbox-optimizer');

const ampOptimizer = AmpOptimizer.create();

const originalHtml = `
<!doctype html>
<html ⚡>
  ...
</html>
`

ampOptimizer.transformHtml(originalHtml).then(optimizedHtml => {
  console.log(optimizedHtml);
});

```

You can find a sample implementation [here](demo/simple/). If you're using express to serve your site, you can use the [AMP Optimizer Middleware](../optimizer-express).

There's also a [command line version](../cli/README.md) available:

```shell
$ npx @ampproject/toolbox-cli myFile.html
```

## Best Practices

### Regenerate pages at least once a week

AMP Optimizer inlines CSS styles required by AMP. To make sure, that the inlined CSS stays in sync with the latest AMP release, we recommend to re-generate pages at least once a week. The good news is, out-of-sync CSS will not break your page, as AMP will check the version of the inlined CSS at runtime and will automatically update it to the latest version.

### Debugging

Enable `verbose` mode to find out why the AMP boilerplate is not being removed. You can
enable verbose mode either when creating a new optimizer instance:

```
// globally
const optimizer = ampOptimizer.create({
  verbose: true
});
```

... or for individual pages:

```
// per transformation
ampOptimizer.transformHtml(originalHtml, {
  verbose: true
})
```

### Transform AMP pages at build time if possible

Applying the transformations to an AMP file consumes additional server resources. Also, since the entire file is needed to apply the transformations, it also becomes impossible to stream the response while applying it. In order to avoid server overhead, if the set of AMP files to be transformed is known in advance, transformations should be run at build time.

### Cache transformed AMPs at runtime

Most websites have a more dynamic nature though and are not able to apply the transformations statically. For such cases it is possible to run the transformations after AMP pages are rendered, e.g. in an Express middleware. In that case, to achieve best performance, it's best to cache transformed pages for subsequent requests. Caching can take place on the CDN level, on the site's internal infrastructure (eg: Memcached), or even on the server itself, if the set of pages is small enough to fit in memory.

## Experimental Features

**Warning: these features are experimental and might result in invalid AMP pages.**

### Paired AMP 

When using experimental features resulting in invalid AMP it's best to setup paired AMP mode. Paired AMP mode will add `<link rel=amphtml href=${ampUrl}>` to the transformed page, were `ampUrl` needs to point to the valid version of this page.

Example:

```
const optimizer = AmpOptimizer.create({
  transformations: AmpOptimizer.TRANSFORMATIONS_PAIRED_AMP,
});
const ampFilePath = filePath.substring(1, filePath.length)
    .replace('.html', '.amp.html');
const transformedHtml = await optimizer.transformHtml(html, {
  // needed to calculate the `<link rel=amphtml href=${ampUrl}>`
  ampUrl: ampFilePath,
});
```

### Versioned AMP Runtime

The `ampRuntimeVersion` parameter will rewrite all AMP runtime and extension imports to the specified version. For example: 

```
https://cdn.ampproject.org/v0.js
```

will be replaced with:

```
https://cdn.ampproject.org/rtv/001515617716922/v0.js
```

Versioning the AMP runtime URLs has one main benefit: versioned AMP runtime URLs are served with a longer max-age than the unversioned ones. This means AMP pages served with versioned AMP runtime benefit from better browser caching.

**Important:** when using versioned AMP runtime URLs make sure to invalidate all caches whenever a new AMP runtime is released. This is to ensure that your AMP pages always use the latest version of the AMP runtime.  

You can use [@ampproject/toolbox-runtime-version](../@ampproject/toolbox-runtime-version) to retrieve the latest version of the AMP runtime. Here is a sample to apply the optimizations including versioning the URLs:

```
const ampOptimizer = require('@ampproject/toolbox-optimizer');
const ampRuntimeVersion = await runtimeVersion.currentVersion();

// The input string
const originalHtml = `
<!doctype html>
<html ⚡>
...
`

// Additional options can be passed as the second argument
const optimizedHtml = await ampOptimizer.transformHtml(originalHtml, {
  ampUrl: 'canonical.amp.html',
  ampRuntimeVersion: ampRuntimeVersion
});

console.log(optimizedHtml);
```

### Blurry image placeholders

Add placeholders for `amp-img` and `amp-video` posters. The placeholders are blurry versions of the corresponding original source. The blur will be displayed as the `<amp-img>` is rendering, and will fade out once the element is loaded. The current requirements of appending a blurry placeholder is for the element is to be a JPEG that is either responsive or a poster for an `amp-video`.

**Important: blurry image placeholder computation is computationally expensive. Make sure to only use it for static or cached pages.**

This transformer supports the following options:

* `blurredPlaceholders`: Enables blurry image placeholder generation. Default is `false`.
* `imageBasePath`: specifies a base path used to resolve an image during build.
* `maxBlurredPlaceholders`: Specifies the max number of blurred images. Defaults to 5.
* `blurredPlaceholdersCacheSize`: Specifies the max number of blurred images to be cached
  to avoid expensive recalculation. Set to 0 if caching should be disabled. Set to -1 if
  all placeholders should be cached (good for static sites). Defaults to 30.

Usage: 

```
const optimizer = AmpOptimizer.create({
  // blurry image placeholders are currently not considered valid AMP
  // hence it's recommended to setup paired AMP mode when enabling this feature.
  transformations: AmpOptimizer.TRANSFORMATIONS_PAIRED_AMP,
  blurredPlaceholders: true,
});
```

### Self-hosted AMP components

It's possible to rewrite the AMP framework and component imports to a different domain than `cdn.ampproject.org`.

Example:
```
const ampOptimizer = require('@ampproject/toolbox-optimizer');

// The input string
const originalHtml = `
<!doctype html>
<html ⚡>
...
`

// Additional options can be passed as the second argument
const optimizedHtml = await ampOptimizer.transformHtml(originalHtml, {
  ampUrl: 'canonical.amp.html',
  // this will rewrite https://cdn.ampproject.org/v0.js to /amp/v0.js
  ampUrlPrefix: '/amp'
});

console.log(optimizedHtml);
```
