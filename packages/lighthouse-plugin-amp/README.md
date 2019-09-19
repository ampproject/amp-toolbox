# Lighthouse AMP plugin

AMP plugin for [Lighthouse](https://github.com/GoogleChrome/lighthouse).

## To run

To run lighthouse in your project, first install lighthouse and lighthouse-plugin-amp as a development dependency:

```sh
$ npm install lighthouse lighthouse-plugin-amp -D
```

Then add a script to your package.json file that will run lighthouse together with the AMP plugin:

```js
  "scripts": {
    "lighthouse": "lighthouse --plugins=lighthouse-plugin-amp --view"
  },
```

Now you can test your site via:

```sh
npm start && npm run lighthouse -- http://localhost:8080 
```
