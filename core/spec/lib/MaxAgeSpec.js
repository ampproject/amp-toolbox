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

const MaxAge = require('../../lib/MaxAge.js');

describe('MaxAge', () => {
  describe('parses value from string', () => {
    it('0 if no max age', () => {
      const maxAge = MaxAge.parse('no-cache');
      expect(maxAge.value).toBe(0);
    });
    it('0 if empty string', () => {
      const maxAge = MaxAge.parse('');
      expect(maxAge.value).toBe(0);
    });
    it('0 if null', () => {
      const maxAge = MaxAge.parse(null);
      expect(maxAge.value).toBe(0);
    });
    it('0 if no number', () => {
      const maxAge = MaxAge.parse('max-age=string');
      expect(maxAge.value).toBe(0);
    });
    it('parses single value cache directive', () => {
      const maxAge = MaxAge.parse('max-age=3000');
      expect(maxAge.value).toBe(3000);
    });
    it('parses multi value cache directive', () => {
      const maxAge = MaxAge.parse('private, max-age=3000, stale-while-revalidate=2592000');
      expect(maxAge.value).toBe(3000);
    });
  });
  describe('isExpired', () => {
    const timestampInMs = 1000;
    const maxAgeInS = 1;
    const maxAge = new MaxAge(timestampInMs, maxAgeInS);
    it('true if given time larger the timestamp + maxAge', () => {
      expect(maxAge.isExpired(timestampInMs + maxAgeInS * 1000 + 1)).toBe(true);
    });
    it('false if given time larger the timestamp + maxAge', () => {
      expect(maxAge.isExpired(timestampInMs + maxAgeInS * 1000 - 1)).toBe(false);
    });
  });
});
