# `page-experience`

** EXPERIMENTAL **

## Usage

```js
const PageExperienceGuide = require('@ammproject/toolbox-page-experience');

(async ()=> {
  const pageExperienceGuide = new PageExperienceGuide();
  const result = pageExperienceGuide.analyze('https://amp.dev');
  console.log('result')
})
```

## Development

Run tests via:

```
npm t
```

Update check result snapshots via:

```
npm run test:snapshot
```