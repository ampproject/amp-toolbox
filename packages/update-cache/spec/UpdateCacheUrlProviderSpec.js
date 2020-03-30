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

const UpdateCacheUrlProvider = require('../lib/UpdateCacheUrlProvider');

const signature = {generate: () => 'RESULT_SIGNATURE'};
const caches = {
  list: () =>
    Promise.resolve([
      {id: 'test', name: 'Test', updateCacheApiDomainSuffix: 'test.com'},
      {id: 'example', name: 'Example', updateCacheApiDomainSuffix: 'example.com'},
    ]),
};

describe('UpdateCacheUrlProvider', () => {
  const updateCacheUrl = new UpdateCacheUrlProvider(signature, caches);

  describe('calculateFromCacheUrl', () => {
    it('Generates the correct signature', () => {
      const timestamp = 1;
      updateCacheUrl.calculateFromCacheUrl('https://test.com', timestamp).then((result) => {
        const expected =
          'https://test.com/update-cache/?amp_action=flush&amp_ts=1&amp_url_signature=RESULT_SIGNATURE';
        expect(result).toBe(expected);
      });
    });

    it('Generates signature with default timestamp', () => {
      updateCacheUrl.calculateFromCacheUrl('https://test.com').then((result) => {
        const regex = /amp_ts=\d+/;
        expect(result).toMatch(regex);
      });
    });
  });

  describe('calculateFromOriginUrl', () => {
    it('Generates update cache URL for each known cache', () => {
      const timestamp = 1;
      updateCacheUrl.calculateFromOriginUrl('https://test.com', timestamp).then((result) => {
        expect(result.length).toBe(2);
        expect(result[0].cacheId).toBe('test');
        expect(result[1].cacheId).toBe('example');
      });
    });
  });
});
