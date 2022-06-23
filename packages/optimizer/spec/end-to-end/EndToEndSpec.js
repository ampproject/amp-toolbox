/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

require('fetch-mock');
const createSpec = require('../helpers/TransformerRunner.js');
const log = require('../../lib/log.js');
const {
  DomTransformer,
  TRANSFORMATIONS_PAIRED_AMP,
  TRANSFORMATIONS_MINIMAL,
} = require('../../lib/DomTransformer.js');
const fetchMock = require('fetch-mock');
const fetch = fetchMock
  .sandbox()
  .mock('https://cdn.ampproject.org/rtv/123456789000000/v0.css', '/* ampproject.org/rtv v0.css */')
  .mock('https://example.com/amp/rtv/123456789000000/v0.css', '/* example.com v0.css */')
  .mock('https://cdn.ampproject.org/v0.css', '/* ampproject.org v0.css */');

createSpec({
  name: 'End-to-End: AMP First',
  testDir: __dirname,
  tag: 'default',
  validAmp: true,
  transformer: {
    transform: (tree, params) => {
      const ampOptimizer = new DomTransformer({
        cache: false,
        fetch,
        log,
        markdown: true,
        runtimeVersion: {currentVersion: () => Promise.resolve('123456789000000')},
      });
      return ampOptimizer.transformTree(tree, params);
    },
  },
});

createSpec({
  name: 'End-to-End: Minimal',
  testDir: __dirname,
  tag: 'minimal',
  validAmp: true,
  ignore: ['body-only'],
  transformer: {
    transform: (tree, params) => {
      const ampOptimizer = new DomTransformer({
        cache: false,
        fetch,
        log,
        markdown: true,
        transformations: [
          'AddMandatoryTags',
          'Markdown',
          'AutoExtensionImporter',
          ...TRANSFORMATIONS_MINIMAL,
        ],
        runtimeVersion: {currentVersion: () => Promise.resolve('123456789000000')},
      });
      return ampOptimizer.transformTree(tree, params);
    },
  },
});

createSpec({
  name: 'End-to-End: LTS',
  testDir: __dirname,
  tag: 'lts',
  validAmp: true,
  transformer: {
    transform: (tree, params) => {
      const ampOptimizer = new DomTransformer({
        cache: false,
        fetch,
        log,
        markdown: true,
        lts: true,
        runtimeVersion: {currentVersion: () => Promise.resolve('123456789000000')},
      });
      return ampOptimizer.transformTree(tree, params);
    },
  },
});

createSpec({
  name: 'End-to-End: Paired AMP',
  testDir: __dirname,
  tag: 'paired',
  transformer: {
    transform: (tree, params) => {
      const ampOptimizer = new DomTransformer({
        cache: false,
        fetch,
        log,
        transformations: TRANSFORMATIONS_PAIRED_AMP,
        runtimeVersion: {currentVersion: () => Promise.resolve('123456789000000')},
      });
      return ampOptimizer.transformTree(tree, params);
    },
  },
});

createSpec({
  name: 'End-to-End: AMP Story Optimized',
  testDir: __dirname,
  tag: 'amp-story-optimized',
  ignore: ['body-only', 'hello-world', 'markdown', 'story', 'trailing-template'],
  transformer: {
    transform: (tree, params) => {
      const ampOptimizer = new DomTransformer({
        cache: false,
        fetch,
        log,
        optimizeAmpStory: true,
        runtimeVersion: {currentVersion: () => Promise.resolve('123456789000000')},
      });
      return ampOptimizer.transformTree(tree, params);
    },
  },
});

createSpec({
  name: 'End-to-End: AMP Story Optimized LTS',
  testDir: __dirname,
  tag: 'amp-story-optimized-lts',
  ignore: ['body-only', 'hello-world', 'markdown', 'story', 'trailing-template'],
  transformer: {
    transform: (tree, params) => {
      const ampOptimizer = new DomTransformer({
        cache: false,
        fetch,
        log,
        optimizeAmpStory: true,
        lts: true,
        runtimeVersion: {currentVersion: () => Promise.resolve('123456789000000')},
      });
      return ampOptimizer.transformTree(tree, params);
    },
  },
});
