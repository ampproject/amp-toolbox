const path = require('path')

module.exports = {
  target: 'webworker',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  resolve: {
    alias: {
      fs: path.resolve(__dirname, 'src', 'stub-modules', 'fs.js'),
      terser: path.resolve(__dirname, 'src', 'stub-modules', 'terser.js'),
    },
  },
  mode: 'production',
  devtool: 'none',
  externals: {
    'jimp': 'jimp',
    'probe-image-size': 'probe-image-size',
    "cssnano-simple": "cssnano-simple",
    "postcss": "postcss",
    "postcss-safe-parser": "postcss-safe-parser",
  }
}
