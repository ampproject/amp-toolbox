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

/* global window */

'use strict';

// Check if we are in a browser environment
let createCacheUrl;
let createCurlsSubdomain;
if (typeof window !== 'undefined') {
  createCacheUrl = window.AmpToolboxCacheUrl.createCacheUrl;
  createCurlsSubdomain = window.AmpToolboxCacheUrl.createCurlsSubdomain;
} else {
  const ampToolboxCacheUrl = require('../dist/amp-toolbox-cache-url.cjs.js');
  createCacheUrl = ampToolboxCacheUrl.createCacheUrl;
  createCurlsSubdomain = ampToolboxCacheUrl.createCurlsSubdomain;
}

describe('AmpUrl', () => {
  const domainSuffix = 'cdn.ampproject.org';

  describe('createCacheUrl', () => {
    const tests = [
      {
        url: 'https://www.example.com',
        cache: 'https://www-example-com.cdn.ampproject.org/c/s/www.example.com',
      },
      {
        url: 'http://www.example.com',
        cache: 'https://www-example-com.cdn.ampproject.org/c/www.example.com',
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
        cache: 'https://xn---com-k47jg78q.cdn.ampproject.org/c/s/點看.com',
      },
    ];

    tests.forEach((test) => {
      it(`transforms ${test.url} into ${test.cache}`, (done) => {
        createCacheUrl(domainSuffix, test.url).then((result) => {
          expect(result).toBe(test.cache);
          done();
        });
      });
    });

    it('transforms a url using the supportType parameter', async () => {
      const result = await createCacheUrl(domainSuffix, 'https://www.example.com', 'viewer');
      expect(result).toBe('https://www-example-com.cdn.ampproject.org/v/s/www.example.com');
    });
  });

  describe('createCurlsSubdomain', () => {
    const tests = [
      {
        url: 'https://something.com',
        curlsSubdomain: 'something-com',
      },
      {
        url: 'https://SOMETHING.COM',
        curlsSubdomain: 'something-com',
      },
      {
        url: 'https://hello-world.com',
        curlsSubdomain: 'hello--world-com',
      },
      {
        url: 'https://hello--world.com',
        curlsSubdomain: 'hello----world-com',
      },
      {
        url: 'https://toplevelnohyphens',
        curlsSubdomain: 'qsgpfjzulvuaxb66z77vlhb5gu2irvcnyp6t67cz6tqo5ae6fysa',
      },
      {
        url: 'https://no-dot-domain',
        curlsSubdomain: '4lxc7wqq7b25walg4rdiil62veijrmqui5z3ept2lyfqqwpowryq',
      },
      {
        url:
          'https://itwasadarkandstormynight.therainfellintorrents.exceptatoccasionalintervalswhenitwascheckedby.aviolentgustofwindwhichsweptupthestreets.com',
        curlsSubdomain: 'dgz4cnrxufaulnwku4ow5biptyqnenjievjht56hd7wqinbdbteq',
      },
      // Wikipedia's example of an IDN: "bücher.ch" -> "bücher-ch".
      {
        url: 'https://xn--bcher-kva.ch',
        curlsSubdomain: 'xn--bcher-ch-65a',
      },
      // Actual URL of Egyptian Ministry of Communications.
      // Right-to-left (RTL) characters will pass through, so long as the entire
      // domain is wholly RTL as in this case. It even renders nicely in Chrome.
      {
        url: 'https://xn--4gbrim.xn----rmckbbajlc6dj7bxne2c.xn--wgbh1c',
        curlsSubdomain: 'xn-------i5fvcbaopc6fkc0de0d9jybegt6cd',
      },
      // A mix of RTL and LTR can't be legally combined into one label.
      // ToASCII() catches this case for us and fails, so we fall back:
      {
        url: 'https://hello.xn--4gbrim.xn----rmckbbajlc6dj7bxne2c.xn--wgbh1c',
        curlsSubdomain: 'a6h5moukddengbsjm77rvbosevwuduec2blkjva4223o4bgafgla',
      },
      {
        url: 'https://en-us.example.com',
        curlsSubdomain: '0-en--us-example-com-0',
      },
    ];

    tests.forEach((test) => {
      it(`transforms ${test.url} into ${test.curlsSubdomain}`, (done) => {
        createCurlsSubdomain(test.url).then((result) => {
          expect(result).toBe(test.curlsSubdomain);
          done();
        });
      });
    });
  });
});
