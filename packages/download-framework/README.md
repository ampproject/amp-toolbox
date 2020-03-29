# AMP Download Framework

[![npm version](https://badge.fury.io/js/%40ampproject%2Ftoolbox-download-framework.svg)](https://badge.fury.io/js/%40ampproject%2Ftoolbox-download-framework)

The AMP Download Framework tool fetches a complete, compiled AMP framework and saves it to disk. You can use this tool to fetch [AMP Project releases](https://github.com/ampproject/amphtml/releases) from `cdn.ampproject.org` or direct it to download an AMP framework hosted elsewhere.

Special handling is included for amp-geo. For hosting environments that [dynamically modify `amp-geo.js`](https://github.com/ampproject/amphtml/blob/master/spec/amp-cache-guidelines.md#guidelines-adding-a-new-cache-to-the-amp-ecosystem) when served, this tool restores the content to its unpatched state.

## Installation

Install via:

```sh
npm install @ampproject/toolbox-download-framework --save
```

## Options

* `dest` (required `string`): Specify the destination directory where the AMP framework should be saved.
* `clear` (optional `boolean`): Remove all contents from the destination directory before saving the AMP framework. Defaults to `true`.
* `rtv` (optional `string`): Specify the runtime version to download. Defaults to the latest production version available.
* `ampUrlPrefix` (optional `string`): Specify the URL where the AMP framework is hosted. Defaults to `https://cdn.ampproject.org`.

Note: When downloading [AMP Project releases](https://github.com/ampproject/amphtml/releases), the runtime version (`rtv`) is obtained by prepending `01` (production) or `00` (canary) to the version. For example, the `rtv` for production release `2003101714470` is `012003101714470`.

## Usage

Basic usage:

```js
const downloadFramework = require('@ampproject/toolbox-download-framework');

let result;

// Download the latest AMP Project release to /tmp/amp
result = await downloadFramework.getFramework({
  dest: '/tmp/amp' // Windows filesystem paths are also supported
});

// Download a specific version of the AMP framework from Bing
result = await downloadFramework.getFramework({
  dest: '/tmp/amp' // Windows filesystem paths are also supported
  rtv: '011912201827130',
  ampPrefixUrl: 'https://www.bing-amp.com'
});

/**
 * The object returned from getFramework() includes the success or failure status,
 * as well as data about the AMP framework that was downloaded:
 * {
 *   status: {boolean} Overall AMP framework download status
 *   error: {string} Error message on failure
 *   count: {number} Number of files in the AMP framework
 *   url: {string} URL to AMP framework
 *   dest: {string} Path to directory where AMP framework was downloaded
 *   rtv: {string} Runtime version of AMP framework
 * }
 */
```
