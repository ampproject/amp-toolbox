/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';
/** @type {LH.Config.Plugin} */
module.exports = {
  audits: [
    {
      path: 'lighthouse-plugin-amp/audits/valid-amp-audit.js',
    },
  ],
  category: {
    title: 'AMP HTML',
    description: '[Learn more](https://amp.dev)',
    auditRefs: [{id: 'valid-amp-audit', weight: 1}],
  },
};
