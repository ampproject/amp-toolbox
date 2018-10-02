import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import builtins from 'rollup-plugin-node-builtins';
import json from 'rollup-plugin-json';
import compiler from '@ampproject/rollup-plugin-closure-compiler';
import pkg from './package.json';

const plugins = [
  resolve({
    preferBuiltins: false,
  }),
  commonjs(),
  json(),
  builtins(),
  compiler(),
];

export default [
  // browser-friendly UMD build
  {
    input: 'index.js',
    output: {
      name: 'amp-toolbox-cache-url',
      file: pkg.browser,
      format: 'umd',
    },
    context: 'window',
    plugins: plugins,
  },
  {
    input: 'index.js',
    output: {file: pkg.module, format: 'es'},
    context: 'window',
    plugins: plugins,
  },
  {
    input: 'index.js',
    output: {file: pkg.main, format: 'cjs'},
    context: 'global',
    plugins: plugins,
  },
];
