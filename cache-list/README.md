# AMP-Toolbox Cache List

Lists known AMP Caches, as available at `https://cdn.ampproject.org/caches.json`.

By default, it uses a one-behind strategy to fetch the caches. This can be customised by
passing a custom fetch strategy to the constructor.

## Usage
```javascript
  const caches = new Caches();

  // Lists known AMP Caches
  const caches = await caches.list();

  // Retrieves a specific AMP cache
  const googleAmpCache = await caches.get('google');
```
