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

const fetchMock = require('fetch-mock');
const {basename, join} = require('path');
const log = require('../../lib/log.js').tag('TransformerSpec');
log.verbose();
const {getDirectories} = require('../helpers/Utils.js');
const createSpec = require('../helpers/TransformerRunner.js');

describe('Transfomers', () => {
  ['experimental', 'valid'].forEach((subDir) => {
    loadTestConfigs(subDir).forEach(createSpec);
  });
});

function loadTestConfigs(subDir) {
  const transfomerTestDirs = getDirectories(join(__dirname, subDir));
  return transfomerTestDirs.map((testDir) => {
    const transformerName = basename(testDir);

    const fetch = fetchMock
      .sandbox()
      .catch(404)
      .mock('https://cdn.ampproject.org/v0.css', '/* v0.css */')
      .mock('https://cdn.ampproject.org/rtv/001515617716922/v0.css', '/* v0-rtv.css */')
      .mock('https://cdn.ampproject.org/rtv/012345678900000/v0.css', '/* v0-prod.css */')
      .mock('https://cdn.ampproject.org/rtv/012345678911111/v0.css', '/* v0-lts.css */')
      .mock('https://example.com/amp/rtv/012345678922222/v0.css', '/* v0-host.css */');
    const Transformer = require(join('../../lib/transformers', transformerName + '.js'));
    const config = {
      fetch,
      log,
      cache: false,
      imageOptimizer: require('../../lib/image-optimizers/simpleRename'),
      runtimeVersion: {
        currentVersion: async (params) => {
          if (params.ampUrlPrefix) {
            return '012345678922222';
          } else if (params.lts) {
            return '012345678911111';
          }
          return '012345678900000';
        },
      },
    };
    try {
      const customConfig = require(join(testDir, 'config.json'));
      Object.assign(config, customConfig);
    } catch (err) {
      // no custom config
    }
    return {
      name: transformerName,
      testDir: testDir,
      transformer: new Transformer(config),
    };
  });
}
