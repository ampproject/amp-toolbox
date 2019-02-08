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

const isAmp = require('../../lib/IsAmp.js');

describe('IsAmp', () => {
  it('returns true if input is marked as AMP', () => {
    [
      ['<!doctype html><html ⚡>', true],
      ['<!doctype html><html amp>', true],
      ['<!doctype html><html amp test>', true],
      ['<!doctype html><html ⚡ test>', true],
      ['<!doctype html><html test ⚡>', true],
      ['<!doctype html><html test amp>', true],
      ['<!doctype html><html\n amp>', true],
      ['<!doctype html><html\t\t amp>', true],
      ['<!doctype html><html ⚡="" test>', true],
      ['<!doctype html><html ⚡="true" test>', true],
      ['<!doctype html><html ⚡=true test>', true],
      ['<!doctype html><html amp="" test>', true],
      ['<!doctype html><html>', false],
      ['<!doctype html><html test>', false],
    ].forEach((test) => expect(isAmp(test[0])).toBe(test[1], `${test[0]} => ${test[1]}`));
  });
});
