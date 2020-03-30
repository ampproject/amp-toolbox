/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import babel from 'rollup-plugin-babel';
import serve from 'rollup-plugin-serve';
import semver from 'semver';
import pkg from './package.json';

const plugins = [
  resolve({
    preferBuiltins: false,
  }),
  json(),
  commonjs(),
];

const nodeFilterImports = {
  imports: {
    './browser/Sha256': ['default'],
  },
};

const browserFilterImports = {
  imports: {
    './node/Sha256': ['default'],
  },
};

const nodePlugins = [
  babel({
    exclude: ['node_modules/**'],
    plugins: [['filter-imports', nodeFilterImports]],
  }),
  ...plugins,
];

const browserPlugins = [
  babel({
    exclude: ['node_modules/**'],
    plugins: [['filter-imports', browserFilterImports]],
  }),
  ...plugins,
];

// Start our server if we are watching
if (process.env.ROLLUP_WATCH) {
  const servePlugin = serve({
    contentBase: ['dist', 'examples'],
    host: 'localhost',
    port: 8000,
  });

  nodePlugins.push(servePlugin);
  browserPlugins.push(servePlugin);
}

if (semver.gt(process.version, '7.99.99')) {
  const compiler = require('@ampproject/rollup-plugin-closure-compiler');
  const filesize = require('rollup-plugin-filesize');
  browserPlugins.push(compiler());
  nodePlugins.push(filesize());
  browserPlugins.push(filesize());
}

export default [
  {
    input: 'index.js',
    output: {
      name: 'amp-toolbox-cache-url',
      file: pkg.browser,
      format: 'umd',
      exports: 'named',
      name: 'AmpToolboxCacheUrl',
    },
    context: 'window',
    plugins: browserPlugins,
  },
  {
    input: 'index.js',
    output: {
      file: pkg.module,
      format: 'es',
      exports: 'named',
    },
    context: 'window',
    plugins: browserPlugins,
  },
  {
    input: 'index.js',
    output: {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
    },
    context: 'global',
    plugins: nodePlugins,
  },
];
