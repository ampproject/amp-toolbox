# AMP-Toolbox Validator Rules

Queries published AMP Validator rules and extracts information about required
markup and attributes for all AMP formats.

## Usage

Install via:

```
$ npm install @ampproject/toolbox-validator-rules@canary
```

### Including the Module

#### ES Module (Browser)

```javascript
import { load } from '@ampproject/toolbox-validator-rules';
```

#### CommonJs (Node)

```javascript
const { load } = require('@ampproject/toolbox-validator-rules');
```

### Using the module

```javascript
  // Loads the validator rules remotely with default options
  const rules = load();

  // Get all tag names used in AMP for Email
  const names = rules.getTagsForFormat('AMP4EMAIL').map(tag => tag.tagName);
```

### Options

`load` optionally accepts an options object allowing you to customize its
behaviour.

The following options are supported:

   * `noCache`: true to always fetch latest rules (by default, subsequent calls to `load` reuse the same result).
   * `rules`: object to use locally specified rules instead of fetching them from the AMP CDN.
   * `url`: override the URL where validator rules are fetched from.
   * `source`: one of `'local'` (load rules from local file named "validator.json"), `'remote'` (fetch rules from CDN) or `'auto'` which is the default (tries looking for the local file first, then tries to fetch from CDN).

Example:

```
load({
  noCache: true,
  source: 'remote'
});
```
