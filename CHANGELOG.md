## 2.0.0-alpha.0 (2020-01-22)

Migration notes:

* The `SeparateKeyframe` transformer's `compress` option has been renamed to `minify`. The same option will also be used by the `MinifyHtml` transformer. The default value continues to be `true`.
* The API for implementing a custom transformer has changed. We no longer monkey patch the node class, but instead rely on helper methods defined in [`NodeUtils`](https://github.com/ampproject/amp-toolbox/blob/master/packages/optimizer/lib/NodeUtils.js):

  ```html
  const {firstChildByTag, appendChild, createElement} = require('@ampproject/toolbox-optimizer').NodeUtils;

  class CustomTransformer {

    constructor(config) {
      this.log_ = config.log.tag('CUSTOM');
    }

    transform(tree, params) {
      this.log_.info('Running custom transformation for ', params.filePath);
      const html = firstChildByTag(tree, 'html');
      if (!html) return;
      const head = firstChildByTag(html, 'head');
      if (!head) return;
      const desc = createElement('meta', {
        name: 'description',
        content: 'this is just a demo',
      });
      appendChild(head, desc);
    }

  }
  ```

#### :rocket: Enhancement
* `cli`, `optimizer`
  * [#576](https://github.com/ampproject/amp-toolbox/pull/576) migrate to htmlparser2 ([@sebastianbenz](https://github.com/sebastianbenz))
  * [#573](https://github.com/ampproject/amp-toolbox/pull/573) Auto inject missing AMP boilerplate ([@sebastianbenz](https://github.com/sebastianbenz))
* `optimizer`
  * [#569](https://github.com/ampproject/amp-toolbox/pull/569) Add AutoExtensionImporter ([@sebastianbenz](https://github.com/sebastianbenz))
* `cors`
  * [#542](https://github.com/ampproject/amp-toolbox/pull/542) Remove AMP-Redirect-To from access-control-expose-headers for email ([@fstanis](https://github.com/fstanis))

#### :house: Internal
* `cli`, `core`, `cors`, `optimizer`, `update-cache`
  * [#575](https://github.com/ampproject/amp-toolbox/pull/575) Auto snapshot ([@sebastianbenz](https://github.com/sebastianbenz))
* `linter`, `optimizer-express`
  * [#570](https://github.com/ampproject/amp-toolbox/pull/570) update dependencies ([@sebastianbenz](https://github.com/sebastianbenz))
* `cache-list`, `cache-url`, `cli`, `core`, `cors`, `lighthouse-plugin-amp`, `linter`, `optimizer-express`, `optimizer`, `runtime-version`, `script-csp`, `update-cache`, `validator-rules`
  * [#568](https://github.com/ampproject/amp-toolbox/pull/568) Adds "repository" and "homepage" to every package.json ([@fstanis](https://github.com/fstanis))

#### Committers: 2
- Filip Stanis ([@fstanis](https://github.com/fstanis))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v1.1.2 (2019-10-15)

#### :bug: Bug Fix
* `optimizer`
  * [#527](https://github.com/ampproject/amp-toolbox/pull/527) Fix: dont' fail optimizer if inline amp-script is empty ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v1.1.2-alpha.0 (2019-10-09)

#### :rocket: Enhancement
* `optimizer`
  * [#518](https://github.com/ampproject/amp-toolbox/pull/518) optimizer: Make dynamic component URL rewrites optional ([@mattwomple](https://github.com/mattwomple))

#### :bug: Bug Fix
* `optimizer`
  * [#517](https://github.com/ampproject/amp-toolbox/pull/517) optimizer: Do not append rtv/{rtv}/ to ampUrlPrefix ([@mattwomple](https://github.com/mattwomple))

#### Committers: 2
- Matt Mower ([@mattwomple](https://github.com/mattwomple))
- Michael Stillwell ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

## v1.1.0 (2019-10-08)

#### :rocket: Enhancement
* `linter`
  * [#490](https://github.com/ampproject/amp-toolbox/pull/490) Improve SXG Vary test ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

#### Committers: 4
- Juny ([@ka2jun8](https://github.com/ka2jun8))
- Matt Mower ([@mattwomple](https://github.com/mattwomple))
- Matt Terenzio ([@mterenzio](https://github.com/mterenzio))
- Michael Stillwell ([@ithinkihaveacat](https://github.com/ithinkihaveacat))


## v1.1.0-beta.1 (2019-09-19)

#### :rocket: Enhancement
* `optimizer`
  * [#465](https://github.com/ampproject/amp-toolbox/pull/465) Add AmpScriptCsp optimizer ([@fstanis](https://github.com/fstanis))
* `script-csp`
  * [#464](https://github.com/ampproject/amp-toolbox/pull/464) Add script-csp toolbox package ([@fstanis](https://github.com/fstanis))

#### :bug: Bug Fix
* `cors`
  * [#493](https://github.com/ampproject/amp-toolbox/pull/493) check 'amp-same-origin' header before 'origin' header ([@wille](https://github.com/wille))
* `optimizer`
  * [#467](https://github.com/ampproject/amp-toolbox/pull/467) Keyframes transformer ([@sebastianbenz](https://github.com/sebastianbenz))
* `core`
  * [#454](https://github.com/ampproject/amp-toolbox/pull/454) Add log.success() fn ([@zerodevx](https://github.com/zerodevx))

#### :house: Internal
* Other
  * [#473](https://github.com/ampproject/amp-toolbox/pull/473) Update dependency eslint to v6.3.0 ([@renovate-bot](https://github.com/renovate-bot))
  * [#458](https://github.com/ampproject/amp-toolbox/pull/458) Update dependency rollup to v1.20.1 ([@renovate-bot](https://github.com/renovate-bot))
  * [#457](https://github.com/ampproject/amp-toolbox/pull/457) Update dependency rollup to v1.20.0 ([@renovate-bot](https://github.com/renovate-bot))
* `optimizer-express`
  * [#468](https://github.com/ampproject/amp-toolbox/pull/468) Update dependency apicache to v1.5.2 ([@renovate-bot](https://github.com/renovate-bot))
  * [#452](https://github.com/ampproject/amp-toolbox/pull/452) Update dependency apicache to v1.5.1 ([@renovate-bot](https://github.com/renovate-bot))
* `linter`
  * [#470](https://github.com/ampproject/amp-toolbox/pull/470) Pin dependencies ([@renovate-bot](https://github.com/renovate-bot))
  * [#441](https://github.com/ampproject/amp-toolbox/pull/441) Pin dependency typescript to 3.5.3 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 6
- Aaron Labiaga ([@alabiaga](https://github.com/alabiaga))
- Filip Stanis ([@fstanis](https://github.com/fstanis))
- Jason Lee ([@zerodevx](https://github.com/zerodevx))
- Michael Cruz ([@MichaelRCruz](https://github.com/MichaelRCruz))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- [@wille](https://github.com/wille)
