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
const colors = require('colors/safe');
const jsdiff = require('diff');
const minify = require('html-minifier').minify;
const {basename, join} = require('path');
const {getFileContents, getDirectories} = require('../helpers/Utils.js');

const treeParser = require('../../lib/TreeParser.js');

const TRANSFORMER_PARAMS = {
  verbose: true,
  ampUrl: 'https://example.com/amp-version.html',
};

const CONFIG_START_TOKEN = '<!--';
const CONFIG_END_TOKEN = '-->';

module.exports = function(testConfig) {
  describe(testConfig.name, () => {
    getDirectories(testConfig.testDir).forEach((testDir) => {
      it(basename(testDir), async (done) => {
        let params = TRANSFORMER_PARAMS;

        // parse input and extract params
        let input = getFileContents(join(testDir, 'input.html'));
        if (input.startsWith(CONFIG_START_TOKEN)) {
          const indexStartConfig = CONFIG_START_TOKEN.length;
          const indexEndConfig = input.indexOf(CONFIG_END_TOKEN);
          const paramsString = input.substring(indexStartConfig, indexEndConfig);
          params = JSON.parse(paramsString);
          // trim params from input string
          input = input.substring(indexEndConfig + CONFIG_END_TOKEN.length);
        }
        const inputTree = treeParser.parse(input);

        // parse expected output
        const expectedOutput = getFileContents(join(testDir, 'expected_output.html'));
        try {
          const expectedOutputTree = treeParser.parse(expectedOutput);
          await testConfig.transformer.transform(inputTree, params);
          compare(inputTree, expectedOutputTree, done);
        } catch (error) {
          done.fail(error);
        }
      });
    });
  });
};

function compare(actualTree, expectedTree, done) {
  const actualHtml = serialize(actualTree);
  const expectedHtml = serialize(expectedTree);
  const diff = jsdiff.diffChars(expectedHtml, actualHtml);
  let failed = false;
  const reason = diff.map((part) => {
    let string;
    if (part.added) {
      string = colors.green(part.value);
      failed = true;
    } else if (part.removed) {
      string = colors.red(part.value);
      failed = true;
    } else {
      string = colors.reset(part.value);
    }
    return string;
  }).join('');

  if (failed) {
    done.fail('Trees do not match\n\n' + reason + '\n\nActual output:\n\n' + actualHtml + '\n\n');
  } else {
    done();
  }
}

function serialize(tree) {
  const html = treeParser.serialize(tree);
  return minify(html, {collapseWhitespace: true});
}
