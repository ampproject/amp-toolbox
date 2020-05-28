/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const parseSizes = require('../../lib/parseSizes');

describe('parseSizes', () => {
  it('null', () => {
    expect(parseSizes(null)).toEqual({
      values: [],
      defaultValue: '',
    });
  });
  it('empty string', () => {
    expect(parseSizes('')).toEqual({
      values: [],
      defaultValue: '',
    });
  });
  it('single value', () => {
    expect(parseSizes('480w')).toEqual({
      values: [],
      defaultValue: '480w',
    });
  });
  it('multiple values', () => {
    expect(parseSizes('(max-width: 600px) 200px, 50vw')).toEqual({
      values: [
        {
          media: '(max-width: 600px)',
          size: '200px',
        },
      ],
      defaultValue: '50vw',
    });
  });
  it('invalid value', () => {
    expect(() => {
      parseSizes('600px, 480w');
    }).toThrow(/Invalid sizes definition/);
  });
  it('whitespace', () => {
    expect(
      parseSizes(` (min-width: 50em) 33vw,
               (min-width: 28em) 50vw,
               100vw `)
    ).toEqual({
      values: [
        {
          media: '(min-width: 50em)',
          size: '33vw',
        },
        {
          media: '(min-width: 28em)',
          size: '50vw',
        },
      ],
      defaultValue: '100vw',
    });
  });
});
