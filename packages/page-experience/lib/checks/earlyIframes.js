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
const earlyIframes = (pageData, result) => {
  if (pageData.criticalIframes.length === 0) {
    return;
  }

  result.warn({
    title: 'Avoid iframes at the beginning of pages',
    message:
      'You have iframes at the top of your page - move them below the initial viewport to improve your loading time',
  });
  result.addDetails({
    headings: [{label: 'src', valueType: 'text', key: 'src'}],
    items: pageData.criticalIframes.map((iframeSrc) => {
      return {src: `\`${iframeSrc}\``};
    }),
  });
};

module.exports = earlyIframes;
