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

const createCacheUrl = require('../lib/AmpCacheUrlGenerator');

describe('AmpUrl', () => {
  const domainSuffix = 'cdn.ampproject.org';

  describe('cacheUrl', () => {
    const tests = [
      {
        url: 'https://www.example.com',
        cache: 'https://www-example-com.cdn.ampproject.org/c/s/www.example.com/',
      },
      {
        url: 'http://www.example.com',
        cache: 'https://www-example-com.cdn.ampproject.org/c/www.example.com/',
      },
      {
        url: 'https://www.example.com/index.html',
        cache: 'https://www-example-com.cdn.ampproject.org/c/s/www.example.com/index.html',
      },
      {
        url: 'http://www.example.com/index.html',
        cache: 'https://www-example-com.cdn.ampproject.org/c/www.example.com/index.html',
      },
      {
        url: 'https://www.example.com/image.png',
        cache: 'https://www-example-com.cdn.ampproject.org/i/s/www.example.com/image.png',
      },
      {
        url: 'http://www.example.com/image.png',
        cache: 'https://www-example-com.cdn.ampproject.org/i/www.example.com/image.png',
      },
      {
        url: 'https://www.example.com/font.woff2',
        cache: 'https://www-example-com.cdn.ampproject.org/r/s/www.example.com/font.woff2',
      },
      {
        url: 'http://www.example.com/font.woff2',
        cache: 'https://www-example-com.cdn.ampproject.org/r/www.example.com/font.woff2',
      },
      {
        url: 'https://example.com/g?value=Hello%20World',
        cache: 'https://example-com.cdn.ampproject.org/c/s/example.com/g?value=Hello%20World',
      },
      {
        url: 'https://點看.com',
        cache: 'https://xn---com-k47jg78q.cdn.ampproject.org/c/s/xn--c1yn36f.com/',
      },
    ];

    tests.forEach((test) => {
      it(`Transforms ${test.url} into ${test.cache}`, () => {
        const result = createCacheUrl(domainSuffix, test.url);
        expect(result).toBe(test.cache);
      });
    });
  });
});
