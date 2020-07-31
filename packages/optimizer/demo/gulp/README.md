# AMP Optimizer Gulp Demo

A sample demonstrating how to use AMP Optimizer using gulp:

```js
const {src, dest} = require('gulp');
const through2 = require('through2');

const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const ampOptimizer = AmpOptimizer.create();

function optimizeAmp(cb) {
  return src('src/*.html')
    .pipe(
      through2.obj(async (file, _, cb) => {
        if (file.isBuffer()) {
          const optimizedHtml = await ampOptimizer.transformHtml(file.contents.toString());
          file.contents = Buffer.from(optimizedHtml);
        }
        cb(null, file);
      })
    )
    .pipe(dest('dist/'));
}

exports.default = optimizeAmp;
```
