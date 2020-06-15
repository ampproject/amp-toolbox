<!---
Copyright 2015 The AMP HTML Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS-IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# AMP Toolbox

[![Build Status](https://travis-ci.org/ampproject/amp-toolbox.svg?branch=main)](https://travis-ci.org/ampproject/amp-toolbox)

A collection of AMP tools making it easier to publish and host AMP pages. The following tools are part of this project:

- **[amp-cache-url](/packages/cache-url):** a javascript library for translating origin URLs to the [AMP Cache URL format](https://developers.google.com/amp/cache/overview).
- **[amp-cache-list](/packages/cache-list):** a javascript library for listing the known AMP Caches.
- **[amp-cli](/packages/cli):** a command line version of AMP Toolbox
- **[amp-cors](/packages/cors):** a connect/express middleware to automatically add [AMP Cors headers](https://www.ampproject.org/docs/fundamentals/amp-cors-requests).
- **[amp-linter](/packages/linter):** a javascript library for linting AMP documents (includes CLI mode).
- **[amp-optimizer](/packages/optimizer):** a javascript library implementing server-side-rendering for AMP pages.
- **[amp-optimizer-express](/packages/optimizer-express)** an [express](http://expressjs.com/) middleware that applies AMP server-side-rendering on the fly.
- **[amp-runtime-fetch](/packages/runtime-fetch):** a javascript library for downloading the AMP runtime.
- **[amp-runtime-version](/packages/runtime-version):** a javascript library for querying the current AMP runtime version.
- **[amp-script-csp](/packages/script-csp):** a javascript library for calculating [`amp-script`](https://amp.dev/documentation/components/amp-script/) compatible CSP hashes.
- **[amp-update-cache](/packages/update-cache):** a javascript library for updating AMP documents in AMP Caches.
- **[amp-validator-rules](/packages/validator-rules):** a javascript library for querying AMP validator rules.

## Development

### Setting up your environment

After forking amp-toolbox to your own github org, do the following steps to get started:

```
# clone your fork to your local machine
git clone https://github.com/your-fork/amp-toolbox.git

# step into local repo
cd amp-toolbox

# install dependencies
npm install

# run tests
npm test
```

### Adding new dependencies

amp-toolbox uses [Lerna](https://lerna.js.org/) to manage it's packages. To keep build times low, `devDependencies` ([but not CLI dependencies](https://github.com/lerna/lerna/issues/1079#issuecomment-337660289)) must be added to the root [package.json](/package.json) file. Runtime dependencies are managed for each package individually.

When adding a new package inside the `packages` directory, register the package via:

```
npm run bootstrap
```

### Running Tests

The test suite runs for all packages and must be run from the root directory.

```
# run tests on node and browser
npm test

# run only in node (fastest)
npm run test:node

# run only in browser
npm run test:browser
```

### Style & Linting

This codebase adheres to the [Google Javascript Styleguide](https://google.github.io/styleguide/jsguide.html) and is enforced using ESLint. ESLint is run as part of the test suite, but you can also explicity run it via:

```
# run ESLint
npm run lint

# run ESLint with `--fix` option to automatically fix errors (if possible)
npm run lint:fix
```

## Contributing

Please see [the CONTRIBUTING file](/CONTRIBUTING.md) for information on contributing to the AMP Project.

## License

AMP Toolbox is made by the [AMP Project](https://www.ampproject.org/), and is licensed under the [Apache License, Version 2.0](/LICENSE).
