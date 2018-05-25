#AMP-Toolbox update-cache

Generates update-cache invalidation URLs, as described on the AMP documentation at 
https://developers.google.com/amp/cache/update-ping#update-cache-request.

## Usage
```javascript
  const createUpdateCacheUrlFactory = require('amp-toolbox-update-cache');

  // Load the private key, generated as described on 
  // https://developers.google.com/amp/cache/update-cache#rsa-keys
  const privateKey = '...';

  // Create an instance of the factory using the private key.
  const updateCacheUrlFactory = createUpdateCacheUrlFactory(privateKey);
  const timestamp = (Date.now() / 1000) | 0; // timestamp as a UNIX Epoch in seconds.

  const cacheUpdateUrls = await updateCacheUrlFactory.fromOriginUrl('https://www.example.com');
  cacheUpdateUrls.forEach(cacheUpdateUrlInfo => {
    console.log('Cache ID:' + cacheUpdateUrlInfo.cacheId);
    console.log('Cache Name:' + cacheUpdateUrlInfo.cacheName);
    console.log('cache-update URL:' + cacheUpdateUrlInfo.updateCacheUrl);
  });
    
```