# AMP-Toolbox Cache URL

Translates an URL from the origin to the AMP Cache URL format, according to the specification
available in the [AMP documentation](https://developers.google.com/amp/cache/overview). This includes the SHA256 fallback URLs used by the AMP Cache on invalid human-readable cache urls.

## Usage

```javascript
  const createCacheUrl = require('amp-toolbox-cache-url');
  const cacheUrl = createCacheUrl('cdn.ampproject.org', 'https://www.example.com');
```
