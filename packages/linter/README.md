# AMP Linter

[![npm
version](https://badge.fury.io/js/@ampproject/toolbox-linter.svg)](https://badge.fury.io/js/@ampproject/toolbox-linter)

## Overview

A [linter](<https://en.wikipedia.org/wiki/Lint_(software)>) for AMP documents:
reports errors and suspicious constructions such as images missing or
incorrectly sized, missing CORS headers, or invalid metadata.

## Usage

Command-line (local build):

```sh
# from the amp-toolbox root
$ npm install
$ npm run build # generates packages/linter/src/cli.js
$ cd packages/linter
$ node src/cli.js https://amp.dev/
```

Command-line (from npm):

```sh
$ npx @ampproject/toolbox-linter@canary https://amp.dev/
```

Node:

```js
const fs = require("fs");
const linter = require("@ampproject/toolbox-linter");
const cheerio = require("cheerio");

const body = fs.readFileSync("amp-dev.html");
const context = {
  $: cheerio.load(body),
  headers: {},
  url: "https://amp.dev/"
};

linter.MetaCharsetIsFirst(context).then(console.log);
```

## `dump-signedexchange`

One test has a dependency on the `dump-signedexchange` go binary. If this is
available ([installation
instructions](https://github.com/WICG/webpackage/tree/master/go/signedexchange#installation))
at additional check of the `application/signed-exchange` response will be
performed.

## Development

**Important note!** Many of the scripts below rely on binaries that are
installed in the `../../node_modules/.bin` directory, and *will fail* if invoked
in the default configuration. To fix this, either:

1. Add `../../node_modules/.bin` to your path. A tool like
   [direnv](https://direnv.net/) may make this easier.
2. Invoke via "wrapper" scripts in `../../package.json`. "test:node:linter" is
   an example of such a script.

### Commands

#### `npm run build`

Builds `*.js` from `*.ts`. Use this instead of `tsc` to ensure the correct
config (via command-line arguments) is in use. (`@pika/plugin-ts-standard-pkg`
needs slightly different config, but it's essentially hardcoded to read from
`tsconfig.json`, so we need to use that for pika.)

#### `npm test`

Runs the tests. (If this doesn't work, try running `npm run test:node:linter`
from the root directory.

#### `npm run lint`

Checks the code for lint errors.

#### `npm run watch`

Automatically rebuild `*.js` whenever `*.ts` changes.

#### `npm run package`

Generates npm-installable version of the package in `pkg/`. From another
directory install via `npm install amp-toolbox/packages/linter/pkg`.

Note: this command will emit multiple warnings of the form 'Valid relative
imports must include the ".js" file extension' as well as complaints about
`require` and `module` not being valid ESM globals; these can both be ignored.

(The first issue is due to extension-less imports [not being valid
ES2018](https://github.com/pikapkg/builders/issues/3); the second is that the
globals `require` and `module` are not valid ESM globals. Not being valid ES2018
is not a problem here, since this code is not designed to run in the browser.)

#### `npm run publish`

Uses @pika's `pack publish` to publish to npm.

### Suggested Development Workflow

1. Create stub rule in `rules/`, that always "fails". e.g. it always returns
   `qqqqqq`. It should extend the `Rule` class.
1. Write tests in `tests/network.ts`. (If HTTP requests are required; if not
   then create a directory in `tests/local/MyNewTest-1` that contains a
   `source.html` (AMP HTML source) and `expected.json` (expected JSON output),
   and `tests/local.js` will automatically execute your "test".)
1. Run the test using `npm test`. If the fixtures can't be found, they will be
   generated automatically (via real network requests). Hopefully your test will
   fail.
1. Fix the implementation, and re-run the test.
1. Use `npm run publish` to publish the new version to npm. (If you have
   two-factor auto turned on, this might not work, even though no errors are
   reported. To actually publish (or at least see the errors), run `npm publish`
   from the `pkg` directory.)
