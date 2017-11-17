# Introduction

Even though AMP is fast, there's no reason why it can't be made faster.

The issues [7022](https://github.com/ampproject/amphtml/issues/7022) and
[8566](https://github.com/ampproject/amphtml/issues/8566) on the AMPHtml Github
project describe some of the possible optimisations that can be executed by
the AMP Caches when serving the AMP files.

Even though the transformations described on those issues are written from the
perspective of the AMP Caches, there's no reason why they can't also be applied
to documents being served from canonical domain.

This project aims to provide the same set of transformations used by AMP
Caches, along with a set of tools to allow using them from canonical domains.

## Usage

1. Node Server

2. Build Step

## Best Practices

### Linking to Valid AMPs
Even though the transformations applied make the pages faster, the generated
files are not valid AMPs anymore. In order to show be available from the AMP
cache, it's important to publish the valid AMPs on its own URLs and [make
them discoverable](https://www.ampproject.org/docs/guides/discovery).

### Statically transform the AMP pages
Applying the transformations to an AMP file consumes additional server
resources. Also, since the entire file is needed to apply the transformations,
it also becomes impossible to stream the response while applying it.

In order to avoid server overhed, if the set of AMP files to be transformed is
predictable, it may be worth to apply those transformations in a build process
of the website.

### Caching when applying transformations in real-time
Most websites have a more dynamic nature though and are not able to apply the
transformations statically. For such cases it is possible to run the
transformations as an Express middleware.

To achieve best performance, those transformations shouldn't be applied to
each and every request, but applied on the *first time* the page is requested,
and then caching the transformed version. This caching can happen on the CDN
level, on the site's internal infrastructure (eg: Memcached), or even on the
server itself, if the set of pages is small enough to fit in memory. The
following requests should be served from one of those caches.

## Why is it faster?

The main reason that makes those transformations faster is that, in order to
avoid the Flash of Unstyled Content (FOUC) and the reflows related to the
usage of web-components, AMP requires websites to add the amp-boilerplate at
the beggining of the file.

The amp-boilerplate renders the page invisible by changing it's opacity, while
the fonts and the AMP Runtime load. Once the AMP runtime is loaded, it is able
to correctly set the sizes of the custom elements and once that happens, the
runtimes make the page visible again.

This means that the first render of the page doesn't happen until the AMP
Runtime is loaded.

In order to improve this, AMP-SSR transforms applies the same rules that the
AMP Runtime does when it's loaded, but on the server side. This ensures that
the reflow will not happen. With that, the amp-boilerplate can be removed, and
the first render will not depend on the AMP Runtime being loaded anymore.

## Caveats
It's important to note that, even though the text content and layout will show
faster, content that depends on the custom AMP elements (eg: any element in
the page that starts with 'amp-') will only be visible after the AMP Runtime
is loaded.

## Transformations

Document each transformer.
