/**
 * Copyright 2021  The AMP HTML Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Checks if iframes are present in the initial viewport
 *
 * @param {Object} pageData
 */
const usingModuleRuntime = (pageData, result) => {
  if (pageData.usingModuleVersion === null) {
    return;
  }

  result.warn({
    title: 'Use the ES module build of the AMP runtime to reduce page load time',
    url: 'https://github.com/ampproject/amp-toolbox/blob/main/packages/optimizer/README.md#experimentesm'
    message:
      'You are optimizing your page, but have not enabled the module version of AMP. Turn it on to push your site even futher',
    details: {
      headings: [
        {key: 'fix', valueType: 'text', label: 'Suggestion'},
      ],
    },
  });
};

module.exports = usingModuleRuntime;
