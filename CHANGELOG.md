## v2.8.0-canary.6 (2021-03-18)

#### :rocket: Enhancement
* `linter`, `page-experience`
  * [#1164](https://github.com/ampproject/amp-toolbox/pull/1164) Add more detailed info to font checks ([@sebastianbenz](https://github.com/sebastianbenz))
* `linter`
  * [#1165](https://github.com/ampproject/amp-toolbox/pull/1165) Check for latest component versions ([@lluerich](https://github.com/lluerich))

#### Committers: 2
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- [@lluerich](https://github.com/lluerich)

## v2.8.0-canary.5 (2021-03-12)

#### :rocket: Enhancement
* `page-experience`
  * [#1160](https://github.com/ampproject/amp-toolbox/pull/1160) Run amp-linter checks as part of this module ([@sebastianbenz](https://github.com/sebastianbenz))
  * [#1156](https://github.com/ampproject/amp-toolbox/pull/1156) Add page experience guide ([@sebastianbenz](https://github.com/sebastianbenz))

#### :memo: Documentation
* `optimizer`
  * [#1154](https://github.com/ampproject/amp-toolbox/pull/1154) Add warning about esmModulesEnabled + amppkg ([@twifkak](https://github.com/twifkak))

#### Committers: 2
- Devin Mullins ([@twifkak](https://github.com/twifkak))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.8.0-canary.4 (2021-02-12)

#### :rocket: Enhancement
* `linter`
  * [#1153](https://github.com/ampproject/amp-toolbox/pull/1153) ♻️ Refactor icon font detection ([@lluerich](https://github.com/lluerich))
  * [#1149](https://github.com/ampproject/amp-toolbox/pull/1149) 🔧 Add icomoon ([@lluerich](https://github.com/lluerich))
  * [#1148](https://github.com/ampproject/amp-toolbox/pull/1148) ♻️ Refine icon font detection ([@lluerich](https://github.com/lluerich))
  * [#1145](https://github.com/ampproject/amp-toolbox/pull/1145) 🚀 Add icon font linter rule ([@lluerich](https://github.com/lluerich))
* `optimizer`
  * [#1147](https://github.com/ampproject/amp-toolbox/pull/1147) Add amp-bind optimizer ([@jridgewell](https://github.com/jridgewell))
  * [#1143](https://github.com/ampproject/amp-toolbox/pull/1143) Add extension scripts in logical order ([@schlessera](https://github.com/schlessera))

#### :bug: Bug Fix
* `optimizer`
  * [#1151](https://github.com/ampproject/amp-toolbox/pull/1151) Show blurredPlaceholders warning only when enabled ([@att55](https://github.com/att55))
  * [#1143](https://github.com/ampproject/amp-toolbox/pull/1143) Add extension scripts in logical order ([@schlessera](https://github.com/schlessera))

#### Committers: 4
- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Atsuto Yamashita ([@att55](https://github.com/att55))
- Justin Ridgewell ([@jridgewell](https://github.com/jridgewell))
- [@lluerich](https://github.com/lluerich)

## v2.8.0-canary.1 (2021-02-12)

#### :bug: Bug Fix
* `optimizer`
  * [#1142](https://github.com/ampproject/amp-toolbox/pull/1142) Don't remove sizes for hero images ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.8.0-canary.0 (2021-02-12)

#### :rocket: Enhancement
* `optimizer`
  * [#1140](https://github.com/ampproject/amp-toolbox/pull/1140) Enable ESM module version of AMP Runtime and Components by default ([@sebastianbenz](https://github.com/sebastianbenz))

#### :bug: Bug Fix
* `optimizer`
  * [#1137](https://github.com/ampproject/amp-toolbox/pull/1137) Drop the final width descriptor in a generated srcset. ([@kristoferbaxter](https://github.com/kristoferbaxter))
  * [#1139](https://github.com/ampproject/amp-toolbox/pull/1139) fix missing custom-element attribute from nomodule import ([@sebastianbenz](https://github.com/sebastianbenz))
  * [#1135](https://github.com/ampproject/amp-toolbox/pull/1135) Add missing amp-ad ending tag ([@schlessera](https://github.com/schlessera))

#### :house: Internal
* `linter`, `optimizer`, `update-cache`
  * [#1141](https://github.com/ampproject/amp-toolbox/pull/1141) Update dependencies ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 3
- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Kristofer Baxter ([@kristoferbaxter](https://github.com/kristoferbaxter))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.7.6 (2021-02-01)

#### :rocket: Enhancement
* `optimizer-docker`, `optimizer`
  * [#1133](https://github.com/ampproject/amp-toolbox/pull/1133) More flexible hero images and blurry placeholders ([@sebastianbenz](https://github.com/sebastianbenz))
* `optimizer`
  * [#1130](https://github.com/ampproject/amp-toolbox/pull/1130) add warning about minification ([@sebastianbenz](https://github.com/sebastianbenz))

#### :bug: Bug Fix
* `optimizer`
  * [#1132](https://github.com/ampproject/amp-toolbox/pull/1132) Don't preload hero images ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.7.5 (2021-01-18)

#### :bug: Bug Fix
* `optimizer`
  * [#1128](https://github.com/ampproject/amp-toolbox/pull/1128) account for cases when parentNode and nextNode are undefined ([@patrickkettner](https://github.com/patrickkettner))
  * [#1124](https://github.com/ampproject/amp-toolbox/pull/1124) Only add space between classes if preexisting class is present ([@schlessera](https://github.com/schlessera))
* `cli`, `linter`, `optimizer`, `update-cache`
  * [#1125](https://github.com/ampproject/amp-toolbox/pull/1125) Support script based templates ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 4
- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Jake Fried ([@samouri](https://github.com/samouri))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- patrick kettner ([@patrickkettner](https://github.com/patrickkettner))

## v2.7.4 (2020-12-23)

#### :bug: Bug Fix
* `cli`, `core`, `linter`, `optimizer`, `runtime-fetch`, `validator-rules`
  * [#1118](https://github.com/ampproject/amp-toolbox/pull/1118) Readd cross fetch ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.7.3 (2020-12-17)

#### :rocket: Enhancement
* `linter`
  * [#1116](https://github.com/ampproject/amp-toolbox/pull/1116) Improve viewport check ([@sebastianbenz](https://github.com/sebastianbenz))

#### :bug: Bug Fix
* `optimizer`
  * [#1115](https://github.com/ampproject/amp-toolbox/pull/1115) Auto add layout=responsive if missing ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.7.2 (2020-12-15)

#### :rocket: Enhancement
* `optimizer`
  * [#981](https://github.com/ampproject/amp-toolbox/pull/981) Encode SVG sizer with base64 ([@schlessera](https://github.com/schlessera))
* `linter`
  * [#980](https://github.com/ampproject/amp-toolbox/pull/980) Add check for disabled tap delay ([@sebastianbenz](https://github.com/sebastianbenz))
  * [#962](https://github.com/ampproject/amp-toolbox/pull/962) Add check for amp-img placeholder does not make additional request ([@kevinkimball](https://github.com/kevinkimball))

#### :bug: Bug Fix
* `optimizer`
  * [#1065](https://github.com/ampproject/amp-toolbox/pull/1065) Split preconnect and dns-prefetch into two separate links ([@schlessera](https://github.com/schlessera))
  * [#974](https://github.com/ampproject/amp-toolbox/pull/974) Generate styles for amp-img object-fit / object-contain ([@sebastianbenz](https://github.com/sebastianbenz))
* `cache-url`
  * [#979](https://github.com/ampproject/amp-toolbox/pull/979) Check if "." before extension in font URL ([@processprocess](https://github.com/processprocess))
  * [#976](https://github.com/ampproject/amp-toolbox/pull/976) Check if "." before extension in image URL ([@processprocess](https://github.com/processprocess))

#### :house: Internal
* `linter`, `optimizer`
  * [#975](https://github.com/ampproject/amp-toolbox/pull/975) Update dependency @ampproject/toolbox-optimizer ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 5
- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Kevin Kimball ([@kevinkimball](https://github.com/kevinkimball))
- Philip Bell ([@processprocess](https://github.com/processprocess))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- patrick kettner ([@patrickkettner](https://github.com/patrickkettner))

## v2.7.1 (2020-10-26)

#### :rocket: Enhancement
* `linter`
  * [#926](https://github.com/ampproject/amp-toolbox/pull/926) Add amp-img srcset linter check ([@tharders](https://github.com/tharders))
* `optimizer`
  * [#911](https://github.com/ampproject/amp-toolbox/pull/911) Allow users to specify version numbers for auto imported extensions ([@digijin](https://github.com/digijin))

#### :bug: Bug Fix
* `optimizer`
  * [#913](https://github.com/ampproject/amp-toolbox/pull/913) Use node instead of root for checking templates in PreloadHeroImages ([@schlessera](https://github.com/schlessera))
  * [#918](https://github.com/ampproject/amp-toolbox/pull/918) Add missing closing tags to <amp-img> elements ([@schlessera](https://github.com/schlessera))
  * [#914](https://github.com/ampproject/amp-toolbox/pull/914) Remove unneeded width & height checks ([@schlessera](https://github.com/schlessera))
  * [#930](https://github.com/ampproject/amp-toolbox/pull/930) Avoid trailing zeros and semicolons in sizer's padding ([@schlessera](https://github.com/schlessera))
  * [#909](https://github.com/ampproject/amp-toolbox/pull/909) Fix handling of malformed `sizes` and `heights` strings ([@chasefinch](https://github.com/chasefinch))

#### Committers: 11
- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Arnav Jindal ([@Daggy1234](https://github.com/Daggy1234))
- Chase Finch ([@chasefinch](https://github.com/chasefinch))
- Damani  ([@Dbrown910](https://github.com/Dbrown910))
- Filip Stanis ([@fstanis](https://github.com/fstanis))
- Grace Tree ([@TheTreeofGrace](https://github.com/TheTreeofGrace))
- Jake Fried ([@samouri](https://github.com/samouri))
- James ([@digijin](https://github.com/digijin))
- Justin Ridgewell ([@jridgewell](https://github.com/jridgewell))
- Matthias Rohmer ([@matthiasrohmer](https://github.com/matthiasrohmer))
- Thorsten Harders ([@tharders](https://github.com/tharders))

## v2.7.0-alpha.3 (2020-08-25)

#### :rocket: Enhancement

- `linter`
  - [#908](https://github.com/ampproject/amp-toolbox/pull/908) Linter rule for AMP Boilerplate removal ([@tharders](https://github.com/tharders))
  - [#907](https://github.com/ampproject/amp-toolbox/pull/907) Linter rule for Google Font preconnect ([@tharders](https://github.com/tharders))

#### Committers: 1

- Thorsten Harders ([@tharders](https://github.com/tharders))

## v2.7.0-alpha.2 (2020-08-21)

#### :rocket: Enhancement

- `linter`
  - [#906](https://github.com/ampproject/amp-toolbox/pull/906) Add linter check for fast google fonts ([@tharders](https://github.com/tharders))
  - [#904](https://github.com/ampproject/amp-toolbox/pull/904) Add linter check for preloading web fonts ([@tharders](https://github.com/tharders))
  - [#902](https://github.com/ampproject/amp-toolbox/pull/902) Preload checks for blocking extensions ([@tharders](https://github.com/tharders))
  - [#890](https://github.com/ampproject/amp-toolbox/pull/890) introduce pageexperience mode ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#901](https://github.com/ampproject/amp-toolbox/pull/901) Feature/linter optimizer checks ([@tharders](https://github.com/tharders))

#### :bug: Bug Fix

- `optimizer`
  - [#896](https://github.com/ampproject/amp-toolbox/pull/896) Don't ssr amp-img in stories ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- `cache-url`, `cli`, `cors`, `linter`, `optimizer`, `runtime-fetch`, `runtime-version`
  - [#899](https://github.com/ampproject/amp-toolbox/pull/899) Make AMP Toolbox build on windows ([@sebastianbenz](https://github.com/sebastianbenz))
- `linter`
  - [#895](https://github.com/ampproject/amp-toolbox/pull/895) Using jest for linter ([@tharders](https://github.com/tharders))
- `lighthouse-plugin-amp`, `linter`, `optimizer`, `update-cache`
  - [#893](https://github.com/ampproject/amp-toolbox/pull/893) update dependencies ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 3

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- Shotaro Watanabe ([@sangotaro](https://github.com/sangotaro))
- Thorsten Harders ([@tharders](https://github.com/tharders))

## v2.6.0 (2020-08-10)

#### :rocket: Enhancement

- `optimizer`
  - [#883](https://github.com/ampproject/amp-toolbox/pull/883) Keep nonces ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#880](https://github.com/ampproject/amp-toolbox/pull/880) Enable amp-img => img transformation for hero images ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#857](https://github.com/ampproject/amp-toolbox/pull/857) Proxy support for amp-optimizer ([@todoa2c](https://github.com/todoa2c))

#### :bug: Bug Fix

- `optimizer`
  - [#887](https://github.com/ampproject/amp-toolbox/pull/887) Fix NPE during SSR when style block is empty ([@sebastianbenz](https://github.com/sebastianbenz))

#### :memo: Documentation

- `optimizer`
  - [#882](https://github.com/ampproject/amp-toolbox/pull/882) add express demo ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#881](https://github.com/ampproject/amp-toolbox/pull/881) add gulp demo ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- `optimizer`
  - [#877](https://github.com/ampproject/amp-toolbox/pull/877) Cssnano simple ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 2

- Atsushi Kanaya ([@todoa2c](https://github.com/todoa2c))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.14 (2020-07-24)

#### :rocket: Enhancement

- `linter`
  - [#871](https://github.com/ampproject/amp-toolbox/pull/871) Linter reporting ([@Dbrown910](https://github.com/Dbrown910))

#### :bug: Bug Fix

- `optimizer`
  - [#872](https://github.com/ampproject/amp-toolbox/pull/872) Fix: hero image not visible on load ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#870](https://github.com/ampproject/amp-toolbox/pull/870) Fix outdated parameter count ([@schlessera](https://github.com/schlessera))

#### Committers: 3

- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Damani ([@Dbrown910](https://github.com/Dbrown910))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.13 (2020-07-15)

#### :bug: Bug Fix

- `runtime-fetch`
  - [#865](https://github.com/ampproject/amp-toolbox/pull/865) Fix: runtime download check ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.12 (2020-07-15)

#### :rocket: Enhancement

- `optimizer`
  - [#859](https://github.com/ampproject/amp-toolbox/pull/859) add experimental amp-img -> img transformation ([@sebastianbenz](https://github.com/sebastianbenz))
- `linter`
  - [#864](https://github.com/ampproject/amp-toolbox/pull/864) Story thumbnail dim req update ([@Dbrown910](https://github.com/Dbrown910))

#### Committers: 2

- Damani ([@Dbrown910](https://github.com/Dbrown910))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.11 (2020-07-14)

#### :bug: Bug Fix

- `optimizer`
  - [#863](https://github.com/ampproject/amp-toolbox/pull/863) fix esm support for auto component import ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.9 (2020-07-08)

#### :bug: Bug Fix

- `optimizer`
  - [#856](https://github.com/ampproject/amp-toolbox/pull/856) Parallelize image optimization ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.8 (2020-07-08)

#### :bug: Bug Fix

- `optimizer`
  - [#855](https://github.com/ampproject/amp-toolbox/pull/855) Only inject runtime-host meta tag if host is given ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.7 (2020-07-08)

#### :bug: Bug Fix

- `optimizer`
  - [#854](https://github.com/ampproject/amp-toolbox/pull/854) Fix runtime-host meta tag when using relative URLs ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.6 (2020-07-07)

#### :rocket: Enhancement

- `optimizer`
  - [#852](https://github.com/ampproject/amp-toolbox/pull/852) Improve preload handling with runtime self hosting ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.5 (2020-06-22)

#### :bug: Bug Fix

- `optimizer`
  - [#850](https://github.com/ampproject/amp-toolbox/pull/850) Don't remove boilerplate for amp-stories ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.4 (2020-06-22)

#### :bug: Bug Fix

- `optimizer`
  - [#846](https://github.com/ampproject/amp-toolbox/pull/846) Fix: MinifyHtml cannot be disabled ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.3 (2020-06-15)

#### :bug: Bug Fix

- `optimizer`
  - [#838](https://github.com/ampproject/amp-toolbox/pull/838) fix(optimizer): add missing dependency node-fetch ([@merceyz](https://github.com/merceyz))

#### Committers: 1

- Kristoffer K. ([@merceyz](https://github.com/merceyz))

## v2.5.2 (2020-06-11)

#### :bug: Bug Fix

- `optimizer`
  - [#835](https://github.com/ampproject/amp-toolbox/pull/835) More robust cache warmup ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- `linter`
  - [#831](https://github.com/ampproject/amp-toolbox/pull/831) Update dependency chalk to v4.1.0 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer`
  - [#830](https://github.com/ampproject/amp-toolbox/pull/830) Update dependency @ampproject/toolbox-optimizer to v2.5.1 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 2

- Damani ([@Dbrown910](https://github.com/Dbrown910))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.1 (2020-06-09)

#### :rocket: Enhancement

- `linter`
  - [#826](https://github.com/ampproject/amp-toolbox/pull/826) Updated og image check to include name attr ([@Dbrown910](https://github.com/Dbrown910))
- `cache-list`, `cli`, `core`, `cors`, `lighthouse-plugin-amp`, `linter`, `optimizer-express`, `optimizer`, `runtime-fetch`, `runtime-version`, `update-cache`
  - [#814](https://github.com/ampproject/amp-toolbox/pull/814) Move hero image preload out of experimental ([@sebastianbenz](https://github.com/sebastianbenz))
- `cli`, `linter`
  - [#806](https://github.com/ampproject/amp-toolbox/pull/806) Sort linter output ([@Dbrown910](https://github.com/Dbrown910))

#### :bug: Bug Fix

- `optimizer`
  - [#828](https://github.com/ampproject/amp-oolbox/pull/828) Do not preload hero images using srcset ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- Other
  - [#829](https://github.com/ampproject/amp-toolbox/pull/829) Update dependency lerna to v3.22.1 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer`
  - [#812](https://github.com/ampproject/amp-toolbox/pull/812) Update dependency @ampproject/toolbox-optimizer to v2.5.0 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 2

- Damani ([@Dbrown910](https://github.com/Dbrown910))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v2.5.0 (2020-05-29)

#### :rocket: Enhancement

- `optimizer`
  - [#807](https://github.com/ampproject/amp-toolbox/pull/807) List all supported options in README ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#805](https://github.com/ampproject/amp-toolbox/pull/805) Support media attribute for hero image preloading ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#763](https://github.com/ampproject/amp-toolbox/pull/763) SSR: Add support for media, sizes and heights attribute ([@sebastianbenz](https://github.com/sebastianbenz))
- `cli`, `linter`, `optimizer-express`, `optimizer`
  - [#772](https://github.com/ampproject/amp-toolbox/pull/772) Add option to generate image srcsets ([@sebastianbenz](https://github.com/sebastianbenz))
- `linter`
  - [#795](https://github.com/ampproject/amp-toolbox/pull/795) Added video subtitle and alt text checks ([@Dbrown910](https://github.com/Dbrown910))
  - [#780](https://github.com/ampproject/amp-toolbox/pull/780) Condense linter output for image alt text check ([@Dbrown910](https://github.com/Dbrown910))
  - [#779](https://github.com/ampproject/amp-toolbox/pull/779) Linter output changes ([@Dbrown910](https://github.com/Dbrown910))

#### :bug: Bug Fix

- `core`, `optimizer`
  - [#799](https://github.com/ampproject/amp-toolbox/pull/799) [optimizer] add missing runtime dependencies ([@sebastianbenz](https://github.com/sebastianbenz))
- `optimizer`
  - [#781](https://github.com/ampproject/amp-toolbox/pull/781) Fix lts ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- Other
  - [#808](https://github.com/ampproject/amp-toolbox/pull/808) Update dependency karma-jasmine to v3.3.1 ([@renovate-bot](https://github.com/renovate-bot))
  - [#803](https://github.com/ampproject/amp-toolbox/pull/803) Update dependency karma-jasmine to v3.3.0 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer-express`
  - [#786](https://github.com/ampproject/amp-toolbox/pull/786) Update dependency http-proxy to v1.18.1 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer`
  - [#789](https://github.com/ampproject/amp-toolbox/pull/789) Update dependency markdown-it to v11 ([@renovate-bot](https://github.com/renovate-bot))
  - [#773](https://github.com/ampproject/amp-toolbox/pull/773) Update dependency @ampproject/toolbox-optimizer to v2.4.0 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 4

- Damani ([@Dbrown910](https://github.com/Dbrown910))
- Kristoffer K. ([@merceyz](https://github.com/merceyz))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- patrick kettner ([@patrickkettner](https://github.com/patrickkettner))

## v2.4.0 (2020-05-13)

#### :bug: Bug Fix

- `optimizer`
  - [#770](https://github.com/ampproject/amp-toolbox/pull/770) Fix postinstall failing on windows ([@sebastianbenz](https://github.com/sebastianbenz))
- `optimizer`
  - [#753](https://github.com/ampproject/amp-toolbox/pull/753) Fix typos in parameter documentation ([@schlessera](https://github.com/schlessera))

#### :rocket: Enhancement

- `core`, `optimizer`
  - [#747](https://github.com/ampproject/amp-toolbox/pull/747) Optimizer: cache runtime artifacts on filesystem ([@sebastianbenz](https://github.com/sebastianbenz))
- `linter`
  - [#755](https://github.com/ampproject/amp-toolbox/pull/755) Added og:image and alt text checks to linter for Stories ([@Dbrown910](https://github.com/Dbrown910))

#### :memo: Documentation

- `optimizer`
  - [#752](https://github.com/ampproject/amp-toolbox/pull/752) Add missing command name to CLI documentation ([@matthiasrohmer](https://github.com/matthiasrohmer))

#### :house: Internal

- Other
  - [#751](https://github.com/ampproject/amp-toolbox/pull/751) Update dependency rollup to v2.8.0 ([@renovate-bot](https://github.com/renovate-bot))
  - [#749](https://github.com/ampproject/amp-toolbox/pull/749) Update dependency fetch-mock to v9.5.0 ([@renovate-bot](https://github.com/renovate-bot))
- `lighthouse-plugin-amp`, `linter`
  - [#750](https://github.com/ampproject/amp-toolbox/pull/750) Update dependency amphtml-validator to v1.0.31 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer`
  - [#748](https://github.com/ampproject/amp-toolbox/pull/748) Update dependency @ampproject/toolbox-optimizer to v2.3.1 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 4

- Alain Schlesser ([@schlessera](https://github.com/schlessera))
- Damani ([@Dbrown910](https://github.com/Dbrown910))
- Matthias Rohmer ([@matthiasrohmer](https://github.com/matthiasrohmer))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## 2.3.1 (2020-05-05)

#### :rocket: Enhancement

- `optimizer`
  - [#736](https://github.com/ampproject/amp-toolbox/pull/736) Extract runtime parameters ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#730](https://github.com/ampproject/amp-toolbox/pull/730) Add experimental image preloading support ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#722](https://github.com/ampproject/amp-toolbox/pull/722) Add experimental module/no-module support ([@sebastianbenz](https://github.com/sebastianbenz))

#### :bug: Bug Fix

- `linter`
  - [#744](https://github.com/ampproject/amp-toolbox/pull/744) WebP is okay for metadata ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

#### :house: Internal

- Other
  - [#746](https://github.com/ampproject/amp-toolbox/pull/746) Update dependency jest to v26.0.1 ([@renovate-bot](https://github.com/renovate-bot))
  - [#714](https://github.com/ampproject/amp-toolbox/pull/714) Update dependency fetch-mock to v9.4.0 ([@renovate-bot](https://github.com/renovate-bot))
  - [#720](https://github.com/ampproject/amp-toolbox/pull/720) Update dependency jest to v25.4.0 ([@renovate-bot](https://github.com/renovate-bot))
  - [#717](https://github.com/ampproject/amp-toolbox/pull/717) Update dependency karma to v5.0.2 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer`
  - [#713](https://github.com/ampproject/amp-toolbox/pull/713) Update dependency @ampproject/toolbox-optimizer to v2.3.0 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 5

- Alberto A. Medina ([@amedina](https://github.com/amedina))
- Matt Mower ([@mdmower](https://github.com/mdmower))
- Michael Stillwell ([@ithinkihaveacat](https://github.com/ithinkihaveacat))
- Naina Raisinghani ([@nainar](https://github.com/nainar))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## 2.3.0 (2020-04-15)

#### :rocket: Enhancement

- `runtime-fetch`
  - [#711](https://github.com/ampproject/amp-toolbox/pull/711) runtime-fetch: Update amp-geo for subdivision matching ([@mdmower](https://github.com/mdmower))
- `cli`, `optimizer`
  - [#691](https://github.com/ampproject/amp-toolbox/pull/691) optimizer: Add lts option to URL rewriter ([@mdmower](https://github.com/mdmower))
- `cli`, `runtime-version`
  - [#695](https://github.com/ampproject/amp-toolbox/pull/695) runtime-version: Update for custom hosts and lts ([@mdmower](https://github.com/mdmower))
- `cache-url`
  - [#701](https://github.com/ampproject/amp-toolbox/pull/701) Adds types to module ([@Enriqe](https://github.com/Enriqe))
- `cache-url`, `cli`
  - [#705](https://github.com/ampproject/amp-toolbox/pull/705) Add support for serving types in createCacheUrl ([@Enriqe](https://github.com/Enriqe))

#### :memo: Documentation

- `cors`, `optimizer-express`, `optimizer`, `update-cache`
  - [#690](https://github.com/ampproject/amp-toolbox/pull/690) Use relative links compatible with github&npmjs ([@mdmower](https://github.com/mdmower))
- `cli`
  - [#685](https://github.com/ampproject/amp-toolbox/pull/685) cli: Add curls command to readme ([@mdmower](https://github.com/mdmower))

#### :house: Internal

- `optimizer`
  - [#684](https://github.com/ampproject/amp-toolbox/pull/684) Update dependency @ampproject/toolbox-optimizer to v2.2.0 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 3

- Enrique Marroquin ([@Enriqe](https://github.com/Enriqe))
- Matt Mower ([@mdmower](https://github.com/mdmower))
- Matthias Rohmer ([@matthiasrohmer](https://github.com/matthiasrohmer))

## 2.2.0 (2020-04-03)

#### :rocket: Enhancement

- `optimizer`
  - [#679](https://github.com/ampproject/amp-toolbox/pull/679) Update to use postcss and cssnano for SeparateKeyframes transform ([@ijjk](https://github.com/ijjk))
- `cli`
  - [#677](https://github.com/ampproject/amp-toolbox/pull/677) cli: Expose runtime-version options ([@mdmower](https://github.com/mdmower))

#### :bug: Bug Fix

- `cli`, `runtime-fetch`
  - [#683](https://github.com/ampproject/amp-toolbox/pull/683) Rename download-runtime => runtime-fetch ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- `optimizer`
  - [#675](https://github.com/ampproject/amp-toolbox/pull/675) Update dependency @ampproject/toolbox-optimizer to v2.1.0 ([@renovate-bot](https://github.com/renovate-bot))
- `cli`
  - [#676](https://github.com/ampproject/amp-toolbox/pull/676) cli: Minor download cleanup ([@mdmower](https://github.com/mdmower))

#### Committers: 3

- JJ Kasper ([@ijjk](https://github.com/ijjk))
- Matt Mower ([@mdmower](https://github.com/mdmower))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## 2.1.0 (2020-04-01)

#### :rocket: Enhancement

- `cli`, `download-runtime`
  - [#663](https://github.com/ampproject/amp-toolbox/pull/663) download-runtime: Add tool to download AMP runtime ([@mdmower](https://github.com/mdmower))
- `cache-url`, `cli`
  - [#666](https://github.com/ampproject/amp-toolbox/pull/666) Update CURLs hasing algorithm ([@sebastianbenz](https://github.com/sebastianbenz))
- `optimizer`
  - [#636](https://github.com/ampproject/amp-toolbox/pull/636) optimizer: Output amp-geo API meta tags ([@mdmower](https://github.com/mdmower))

#### :bug: Bug Fix

- `optimizer`
  - [#653](https://github.com/ampproject/amp-toolbox/pull/653) Don't separate keyframes for AMP Stories ([@sebastianbenz](https://github.com/sebastianbenz))

#### :memo: Documentation

- `cache-list`
  - [#662](https://github.com/ampproject/amp-toolbox/pull/662) cache-list: Update caches example in readme ([@mdmower](https://github.com/mdmower))
- `linter`
  - [#656](https://github.com/ampproject/amp-toolbox/pull/656) Fix linter README ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

#### :house: Internal

- `optimizer`
  - [#672](https://github.com/ampproject/amp-toolbox/pull/672) chore(deps): update dependency @ampproject/toolbox-optimizer to v2 ([@renovate-bot](https://github.com/renovate-bot))
  - [#627](https://github.com/ampproject/amp-toolbox/pull/627) Pin dependencies ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 4

- Duncan Kolba ([@dkolba](https://github.com/dkolba))
- Matt Mower ([@mdmower](https://github.com/mdmower))
- Michael Stillwell ([@ithinkihaveacat](https://github.com/ithinkihaveacat))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## 2.0.1

#### :rocket: Enhancement

- `optimizer`
  - [#622](https://github.com/ampproject/amp-toolbox/pull/622) optimizer: Add meta tags for singleDoc self-host ([@mdmower](https://github.com/mdmower))

#### :bug: Bug Fix

- `optimizer`
  - [#649](https://github.com/ampproject/amp-toolbox/pull/649) Encode JSON values ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#618](https://github.com/ampproject/amp-toolbox/pull/618) Fix: auto extension import amp-access-laterpay & amp-subscriptions-google ([@sebastianbenz](https://github.com/sebastianbenz))
- `linter`
  - [#626](https://github.com/ampproject/amp-toolbox/pull/626) Test explicitly for existance of value ([@dritter](https://github.com/dritter))

#### :house: Internal

- `cli`, `lighthouse-plugin-amp`, `linter`, `optimizer`
  - [#648](https://github.com/ampproject/amp-toolbox/pull/648) update dependencies ([@sebastianbenz](https://github.com/sebastianbenz))
- Other
  - [#624](https://github.com/ampproject/amp-toolbox/pull/624) Update dependency nock to v12 ([@renovate-bot](https://github.com/renovate-bot))
  - [#625](https://github.com/ampproject/amp-toolbox/pull/625) Update dependency @ampproject/rollup-plugin-closure-compiler to v0.22.2 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 3

- Dominik Ritter ([@dritter](https://github.com/dritter))
- Matt Mower ([@mdmower](https://github.com/mdmower))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## 2.0.0

Migration notes:

- The `SeparateKeyframe` transformer's `compress` option has been renamed to `minify`. The same option will also be used by the `MinifyHtml` transformer. The default value continues to be `true`.
- The API for implementing a custom transformer has changed. We no longer monkey patch the node class, but instead rely on helper methods defined in [`NodeUtils`](https://github.com/ampproject/amp-toolbox/blob/main/packages/optimizer/lib/NodeUtils.js):

  ```html
  const {firstChildByTag, appendChild, createElement} =
  require('@ampproject/toolbox-optimizer').NodeUtils; class CustomTransformer { constructor(config)
  { this.log_ = config.log.tag('CUSTOM'); } transform(tree, params) { this.log_.info('Running custom
  transformation for ', params.filePath); const html = firstChildByTag(tree, 'html'); if (!html)
  return; const head = firstChildByTag(html, 'head'); if (!head) return; const desc =
  createElement('meta', { name: 'description', content: 'this is just a demo', }); appendChild(head,
  desc); } }
  ```

#### :rocket: Enhancement

- `core`, `optimizer`
  - [#588](https://github.com/ampproject/amp-toolbox/pull/588) Add MinifyHtml transformer ([@sebastianbenz](https://github.com/sebastianbenz))
- `cli`, `optimizer`
  - [#576](https://github.com/ampproject/amp-toolbox/pull/576) migrate to htmlparser2 ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#573](https://github.com/ampproject/amp-toolbox/pull/573) Auto inject missing AMP boilerplate ([@sebastianbenz](https://github.com/sebastianbenz))
- `optimizer`
  - [#569](https://github.com/ampproject/amp-toolbox/pull/569) Add AutoExtensionImporter ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#596](https://github.com/ampproject/amp-toolbox/pull/596) Add Markdown transformer ([@sebastianbenz](https://github.com/sebastianbenz))
- `cors`
  - [#542](https://github.com/ampproject/amp-toolbox/pull/542) Remove AMP-Redirect-To from access-control-expose-headers for email ([@fstanis](https://github.com/fstanis))

#### :bug: Bug Fix

- `optimizer`
  - [#591](https://github.com/ampproject/amp-toolbox/pull/591) Only trim whitespace in head ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#590](https://github.com/ampproject/amp-toolbox/pull/590) AutoExtensionImporter: fix amp-carousel adding amp-lightbox-gallery ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#581](https://github.com/ampproject/amp-toolbox/pull/581) Fix: Empty <amp-experiment> blocks boilerplate removal ([@sebastianbenz](https://github.com/sebastianbenz))
  - [#580](https://github.com/ampproject/amp-toolbox/pull/580) Fix: ReorderHead priorities ([@sebastianbenz](https://github.com/sebastianbenz))

#### :house: Internal

- `cli`, `core`, `cors`, `optimizer`, `update-cache`
  - [#575](https://github.com/ampproject/amp-toolbox/pull/575) Auto snapshot ([@sebastianbenz](https://github.com/sebastianbenz))
- `linter`, `optimizer-express`
  - [#570](https://github.com/ampproject/amp-toolbox/pull/570) update dependencies ([@sebastianbenz](https://github.com/sebastianbenz))
- `cache-list`, `cache-url`, `cli`, `core`, `cors`, `lighthouse-plugin-amp`, `linter`, `optimizer-express`, `optimizer`, `runtime-version`, `script-csp`, `update-cache`, `validator-rules`
  - [#568](https://github.com/ampproject/amp-toolbox/pull/568) Adds "repository" and "homepage" to every package.json ([@fstanis](https://github.com/fstanis))

#### Committers: 2

- Filip Stanis ([@fstanis](https://github.com/fstanis))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v1.1.2 (2019-10-15)

#### :bug: Bug Fix

- `optimizer`
  - [#527](https://github.com/ampproject/amp-toolbox/pull/527) Fix: dont' fail optimizer if inline amp-script is empty ([@sebastianbenz](https://github.com/sebastianbenz))

#### Committers: 1

- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))

## v1.1.2-alpha.0 (2019-10-09)

#### :rocket: Enhancement

- `optimizer`
  - [#518](https://github.com/ampproject/amp-toolbox/pull/518) optimizer: Make dynamic component URL rewrites optional ([@mattwomple](https://github.com/mattwomple))

#### :bug: Bug Fix

- `optimizer`
  - [#517](https://github.com/ampproject/amp-toolbox/pull/517) optimizer: Do not append rtv/{rtv}/ to ampUrlPrefix ([@mattwomple](https://github.com/mattwomple))

#### Committers: 2

- Matt Mower ([@mattwomple](https://github.com/mattwomple))
- Michael Stillwell ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

## v1.1.0 (2019-10-08)

#### :rocket: Enhancement

- `linter`
  - [#490](https://github.com/ampproject/amp-toolbox/pull/490) Improve SXG Vary test ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

#### Committers: 4

- Juny ([@ka2jun8](https://github.com/ka2jun8))
- Matt Mower ([@mattwomple](https://github.com/mattwomple))
- Matt Terenzio ([@mterenzio](https://github.com/mterenzio))
- Michael Stillwell ([@ithinkihaveacat](https://github.com/ithinkihaveacat))

## v1.1.0-beta.1 (2019-09-19)

#### :rocket: Enhancement

- `optimizer`
  - [#465](https://github.com/ampproject/amp-toolbox/pull/465) Add AmpScriptCsp optimizer ([@fstanis](https://github.com/fstanis))
- `script-csp`
  - [#464](https://github.com/ampproject/amp-toolbox/pull/464) Add script-csp toolbox package ([@fstanis](https://github.com/fstanis))

#### :bug: Bug Fix

- `cors`
  - [#493](https://github.com/ampproject/amp-toolbox/pull/493) check 'amp-same-origin' header before 'origin' header ([@wille](https://github.com/wille))
- `optimizer`
  - [#467](https://github.com/ampproject/amp-toolbox/pull/467) Keyframes transformer ([@sebastianbenz](https://github.com/sebastianbenz))
- `core`
  - [#454](https://github.com/ampproject/amp-toolbox/pull/454) Add log.success() fn ([@zerodevx](https://github.com/zerodevx))

#### :house: Internal

- Other
  - [#473](https://github.com/ampproject/amp-toolbox/pull/473) Update dependency eslint to v6.3.0 ([@renovate-bot](https://github.com/renovate-bot))
  - [#458](https://github.com/ampproject/amp-toolbox/pull/458) Update dependency rollup to v1.20.1 ([@renovate-bot](https://github.com/renovate-bot))
  - [#457](https://github.com/ampproject/amp-toolbox/pull/457) Update dependency rollup to v1.20.0 ([@renovate-bot](https://github.com/renovate-bot))
- `optimizer-express`
  - [#468](https://github.com/ampproject/amp-toolbox/pull/468) Update dependency apicache to v1.5.2 ([@renovate-bot](https://github.com/renovate-bot))
  - [#452](https://github.com/ampproject/amp-toolbox/pull/452) Update dependency apicache to v1.5.1 ([@renovate-bot](https://github.com/renovate-bot))
- `linter`
  - [#470](https://github.com/ampproject/amp-toolbox/pull/470) Pin dependencies ([@renovate-bot](https://github.com/renovate-bot))
  - [#441](https://github.com/ampproject/amp-toolbox/pull/441) Pin dependency typescript to 3.5.3 ([@renovate-bot](https://github.com/renovate-bot))

#### Committers: 6

- Aaron Labiaga ([@alabiaga](https://github.com/alabiaga))
- Filip Stanis ([@fstanis](https://github.com/fstanis))
- Jason Lee ([@zerodevx](https://github.com/zerodevx))
- Michael Cruz ([@MichaelRCruz](https://github.com/MichaelRCruz))
- Sebastian Benz ([@sebastianbenz](https://github.com/sebastianbenz))
- [@wille](https://github.com/wille)
