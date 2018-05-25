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

'use strict';

const UpdateCacheUrlFactory = require('../lib/UpdateCacheUrlFactory');
const signature = {create: () => ''};
const caches = {list: () => Promise.resolve([
  {id: 'test', name: 'Test', updateCacheApiDomainSuffix: 'test.com'},
  {id: 'example', name: 'Example', updateCacheApiDomainSuffix: 'example.com'}
])};

describe('UpdateCacheUrl', () => {
  const updateCacheUrl = new UpdateCacheUrlFactory(signature, caches);

  describe('fromCacheUrl', () => {
    it('Generates the correct signature', () => {
      const timestamp = 1;
      const result = updateCacheUrl.fromCacheUrl('https://test.com', timestamp);
      const expected =
          'https://test.com/update-cache/?amp_action=flush&amp_ts=1&amp_url_signature=';
      expect(result).toBe(expected);
    });
  });

  describe('fromOriginUrl', () => {
    const timestamp = 1;
    updateCacheUrl.fromOriginUrl('https://test.com', timestamp)
      .then(result => {
        expect(result.length).toBe(2);
      });
  });
});
