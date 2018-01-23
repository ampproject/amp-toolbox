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

const AmpCaches = require('../index');

const CACHES_JSON = JSON.parse(
`{
  "caches": [
    {
      "id": "google",
      "name": "Google AMP Cache",
      "docs": "https://developers.google.com/amp/cache/",
      "updateCacheApiDomainSuffix": "cdn.ampproject.org"
    }
  ]
}`);

describe('Caches', () => {
  const fetchStrategy = {
    get: () => Promise.resolve(CACHES_JSON)
  };
  const caches = new AmpCaches(fetchStrategy);

  describe('list', () => {
    it('returns an array with the caches', async () => {
      const cacheList = await caches.list();
      expect(cacheList.length).toBe(1);
    });
  });

  describe('get', () => {
    it('returns the correct cache', async () => {
      const googleCache = await caches.get('google');
      expect(googleCache.id).toBe('google');
      expect(googleCache.name).toBe('Google AMP Cache');
      expect(googleCache.docs).toBe('https://developers.google.com/amp/cache/');
      expect(googleCache.updateCacheApiDomainSuffix).toBe('cdn.ampproject.org');
    });

    it('returns undefined for unexisting cache', async() => {
      const googleCache = await caches.get('unexisting');
      expect(googleCache).toBeUndefined();
    });
  });
});
