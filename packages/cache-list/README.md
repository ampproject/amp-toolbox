# AMP-Toolbox Cache List

[![npm version](https://badge.fury.io/js/amp-toolbox-cache-list.svg)](https://badge.fury.io/js/amp-toolbox-cache-list)

Lists known AMP Caches, as available at `https://cdn.ampproject.org/caches.json`.

By default, it uses a one-behind strategy to fetch the caches. This can be customised by
passing a custom fetch strategy to the constructor.

## Usage
```javascript
  const Caches = require('amp-toolbox-cache-list');

  // Lists known AMP Caches
  const caches = await new Caches().list();

  // Retrieves a specific AMP cache
  const googleAmpCache = await caches.get('google');
```
