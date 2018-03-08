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

const AmpUrl = require('../lib/AmpUrl');

describe('AmpUrl', () => {
  const ampUrl = new AmpUrl();
  const cache = {
    updateCacheApiDomainSuffix: 'cdn.ampproject.org'
  };

  describe('cacheUrl', () => {
    const tests = [
      {canonical: 'https://www.example.com',
        cache: 'https://www-example-com.cdn.ampproject.org/c/s/www.example.com/'},
      {canonical: 'http://www.example.com',
        cache: 'https://www-example-com.cdn.ampproject.org/c/www.example.com/'},
      {canonical: 'https://www.example.com/index.html',
        cache: 'https://www-example-com.cdn.ampproject.org/c/s/www.example.com/index.html'},
      {canonical: 'http://www.example.com/index.html',
        cache: 'https://www-example-com.cdn.ampproject.org/c/www.example.com/index.html'},
      {canonical: 'https://www.example.com/image.png',
        cache: 'https://www-example-com.cdn.ampproject.org/i/s/www.example.com/image.png'},
      {canonical: 'http://www.example.com/image.png',
        cache: 'https://www-example-com.cdn.ampproject.org/i/www.example.com/image.png'},
      {canonical: 'https://www.example.com/font.woff2',
        cache: 'https://www-example-com.cdn.ampproject.org/r/s/www.example.com/font.woff2'},
      {canonical: 'http://www.example.com/font.woff2',
        cache: 'https://www-example-com.cdn.ampproject.org/r/www.example.com/font.woff2'}
    ];

    tests.forEach(url => {
      it(`Transforms ${url.canonical} into ${url.cache}`, () => {
        const result = ampUrl.cacheUrl(cache.updateCacheApiDomainSuffix, url.canonical);
        expect(result).toBe(url.cache);
      });
    });
  });
});
