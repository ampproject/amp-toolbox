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

const {basename, join} = require('path');
const {getDirectories} = require('../helpers/Utils.js');
const createSpec = require('../helpers/TransformerRunner.js');

describe('Transfomers', () => {
  loadTestConfigs().forEach(createSpec);
});

function loadTestConfigs() {
  const transfomerTestDirs = getDirectories(__dirname);
  return transfomerTestDirs.map((testDir) => {
    const transformerName = basename(testDir);
    return {
      name: transformerName,
      testDir: testDir,
      transformer: require(join('../../lib/transformers', transformerName + '.js')),
    };
  });
}
