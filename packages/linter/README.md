# AMP Linter

[![npm version](https://badge.fury.io/js/%40ampproject%2Ftoolbox-linter.svg)](https://badge.fury.io/js/%40ampproject%2Ftoolbox-linter)

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

```sh <!-- markdownlint-disable MD014 -->
$ npx @ampproject/toolbox-linter https://amp.dev/
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

### Commands/Scripts

These scripts can be invoked in the usual way by `npm run XXX` if `npm install`
is run in this directory. They can also be invoked from the `amp-toolbox` root
directory without installing locally by `lerna run --scope '*/toolbox-linter'
XXX`. (lerna sets the `PATH` so that the required binaries are available.)

#### `prepack`

Intended to be used when building a package. (It's automatically invoked by `npm
pack`.) Populates the `dist` directory with the appropriate `*.js` files. (Tests
are not included.)

#### `build`

Builds `*.js` from `*.ts`, placing them in the same directory as the source.
(Intended to be used in development.)

#### `watch`

Like `build`, but automatically rebuilds the `*.js` whenever the corresponding
`*.ts` changes. (Intended to be used in development.)

#### `test`

Runs the tests.

#### `lint`

Checks the code for lint errors using prettier.

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
