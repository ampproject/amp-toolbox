#AMP-Toolbox update-cache

Generates update-cache invalidation URLs, as described on the [Google AMP Cache documentation](
https://developers.google.com/amp/cache/update-ping#update-cache-request).

## Usage
```javascript
  const UpdateCacheUrlProvider = require('amp-toolbox-update-cache');

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