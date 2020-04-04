# AMP-Toolbox update-cache

[![npm version](https://badge.fury.io/js/%40ampproject%2Ftoolbox-update-cache.svg)](https://badge.fury.io/js/%40ampproject%2Ftoolbox-update-cache)

Generates AMP Cache invalidation URLs for all known AMP Caches. For more info see the [Google AMP Cache documentation](https://developers.google.com/amp/cache/update-ping#update-cache-request).

## Usage

Install via:

```sh
npm install @ampproject/toolbox-update-cache
```

Generate a list of update URLs like this:

```javascript
  const UpdateCacheUrlProvider = require('@ampproject/toolbox-update-cache');

  // Load the private key, generated as described on 
  // https://developers.google.com/amp/cache/update-cache#rsa-keys
  const privateKey = '...';

  // Create an instance of the factory using the private key.
  const updateCacheUrlProvider = UpdateCacheUrlProvider.create(privateKey);

  updateCacheUrlProvider.calculateFromOriginUrl('https://www.example.com')
    .then(cacheUpdateUrls => {
      cacheUpdateUrls.forEach(cacheUpdateUrlInfo => {
        console.log('Cache ID:' + cacheUpdateUrlInfo.cacheId);
        console.log('Cache Name:' + cacheUpdateUrlInfo.cacheName);
        console.log('cache-update URL:' + cacheUpdateUrlInfo.updateCacheUrl);
      });
    });
```

Note: this only generates the URLs, but doesn't perform the actual update request. 
