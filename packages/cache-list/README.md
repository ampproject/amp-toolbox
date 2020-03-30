# AMP-Toolbox Cache List

[![npm version](https://badge.fury.io/js/%40ampproject%2Ftoolbox-cache-list.svg)](https://badge.fury.io/js/%40ampproject%2Ftoolbox-cache-list)

Lists known AMP Caches, as available at `https://cdn.ampproject.org/caches.json`.

By default, it uses a one-behind caching strategy to fetch the caches. This can be customised by
passing a custom fetch strategy to the constructor.

## Usage

Install via:

```
$ npm install @ampproject/toolbox-cache-list
```

List all known caches:

```
  const Caches = require('@ampproject/toolbox-cache-list');

  const allCaches = await Caches.list();
```

Which will return an array similar to:

```
[
  {
    "id": "google",
    "name": "Google AMP Cache",
    "docs": "https://developers.google.com/amp/cache/",
    "cacheDomain": "cdn.ampproject.org",
    "updateCacheApiDomainSuffix": "cdn.ampproject.org",
    "thirdPartyFrameDomainSuffix": "ampproject.net"
  },
  {
    "id": "bing",
    "name": "Bing AMP Cache",
    "docs": "https://www.bing.com/webmaster/help/bing-amp-cache-bc1c884c",
    "cacheDomain": "www.bing-amp.com",
    "updateCacheApiDomainSuffix": "www.bing-amp.com",
    "thirdPartyFrameDomainSuffix": "www.bing-amp.net"
  }
]
```

Fetching info about a specific AMP cache via the cache id:

```
  const Caches = require('@ampproject/toolbox-cache-list');

  const googleAmpCache = await Caches.get('google');
```

Which will return:

```
{
  "id": "google",
  "name": "Google AMP Cache",
  "docs": "https://developers.google.com/amp/cache/",
  "cacheDomain": "cdn.ampproject.org",
  "updateCacheApiDomainSuffix": "cdn.ampproject.org",
  "thirdPartyFrameDomainSuffix": "ampproject.net"
}
```
