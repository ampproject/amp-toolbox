# AMP-Toolbox Cache URL

Translates an url from the origin to the AMP Cache URL format, according to the specification
available in the [AMP documentation](https://developers.google.com/amp/cache/overview).

## Usage

``javascript
const ampUrl = require('amp-toolbox-cache-url');
const cacheUrl = ampUrl.cacheUrl('cdn.ampproject.org', 'https://www.example.com');
``