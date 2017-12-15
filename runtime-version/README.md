# AMP Runtime Version

Use it to query `cdn.ampproject.org` for the current release or canary version
of the AMP Runtime. Uses a stale-while-revalidate caching strategy to avoid 
network requests in the critical path.

## Installation

Install via:

```sh
npm install amp-toolbox-runtime-version
```

## Usage

Basic usage:

```js
const runtimeVersion = require('amp-toolbox-runtime-version');

// Release version
runtimeVersion.currentVersion().then(version => {
  console.log(version);
});

// Canary version
runtimeVersion.currentVersion({canary: true}).then(version => {
  console.log(version);
});
```
