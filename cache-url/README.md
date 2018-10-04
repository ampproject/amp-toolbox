# AMP-Toolbox Cache URL

Translates an URL from the origin to the AMP Cache URL format, according to the specification
available in the [AMP documentation](https://developers.google.com/amp/cache/overview). This includes the SHA256 fallback URLs used by the AMP Cache on invalid human-readable cache urls.

## Usage

```javascript
  // Import the module
  const ampToolboxCacheUrl = require('amp-toolbox-cache-url');

  // Get an AMP Cache URL
  ampToolboxCacheUrl.createCacheUrl('cdn.ampproject.org', 'https://www.example.com').then((cacheUrl) => {
    // This would log: 
    // 'https://www-example-com.cdn.ampproject.org/c/s/www.example.com/'
    console.log(cacheUrl);
  });

  // Transform a domain to an AMP Cache subdomain
  ampToolboxCacheUrl.createCurlsSubdomain('https://www.example.com').then((curlsSubdomain) => {
    // This would log: 
    // 'www-example-com'
    console.log(curlsSubdomain);
  });
```
