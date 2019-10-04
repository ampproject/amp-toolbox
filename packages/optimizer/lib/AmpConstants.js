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
'mode strict';

module.exports = {
  AMP_TAGS: ['amp', '⚡', '⚡4ads'],
  AMP_CACHE_HOST: 'https://cdn.ampproject.org',
  // Should be kept up to date with dynamic components listed here:
  // https://github.com/ampproject/amphtml/blob/master/spec/amp-cache-guidelines.md#guidelines-adding-a-new-cache-to-the-amp-ecosystem
  AMP_DYNAMIC_COMPONENTS: {
    'custom-element': ['amp-geo'],
    'custom-template': [],
  },
  appendRuntimeVersion: (prefix, version) => prefix + '/rtv/' + version,
};
