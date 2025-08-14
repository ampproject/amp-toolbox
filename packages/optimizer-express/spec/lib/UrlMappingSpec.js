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

const UrlMapping = require('../../lib/UrlMapping');

describe('UrlMapping', () => {
  const urlMapping = new UrlMapping('amp');

  describe('isAmpUrl', () => {
    it('correctly identifies AMP urls', () => {
      const result = urlMapping.isAmpUrl('/page?amp=1');
      expect(result).toBe(true);
    });

    it('correctly identifies AMP urls, when parameter doesn\'t have the "=" sign', () => {
      const result = urlMapping.isAmpUrl('/page?amp');
      expect(result).toBe(true);
    });

    it('correctly identifies non-AMP urls', () => {
      const result = urlMapping.isAmpUrl('/page');
      expect(result).toBe(false);
    });
  });

  describe('toAmpUrl', () => {
    it('correctly transforms canonical URLs to AMP', () => {
      const result = urlMapping.toAmpUrl('/page');
      expect(result).toBe('/page?amp=1');
    });
  });

  describe('toCanonicalUrl', () => {
    it('correctly transforms AMP URLs to Canonical', () => {
      const result = urlMapping.toCanonicalUrl('/page?amp=1');
      expect(result).toBe('/page');
    });
  });
});
