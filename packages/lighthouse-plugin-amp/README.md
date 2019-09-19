# Lighthouse AMP plugin

AMP plugin for [Lighthouse](https://github.com/GoogleChrome/lighthouse).

## To run

1. Install `lighthouse`.
   `npm install lighthouse'
   If already installed, verify the version supports plugins (version 5 or later).
2. Install the plugin as a (peer) dependency, parallel to `lighthouse` by either cloning the the repo or installing it as a module.
   `git clone https://github.com/ampproject/amp-toolbox.git && npm install amp-toolbox/packages/lighthouse-plugin-amp/`
    or
   `npm install lighthouse-plugin-amp'
3. Run `npx -p lighthouse lighthouse https://amp.dev --plugins=lighthouse-plugin-amp --view`
