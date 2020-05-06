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

const FileSystemCache = require('../../lib/FileSystemCache.js');

let cache;

beforeEach(async () => {
  cache = FileSystemCache.create();
  await cache.clear();
});
//afterEach(async () => await cache.clear());

test('returns null by default', async () => {
  const result = await cache.get('key');
  expect(result).toBe(null);
});

test('returns default value', async () => {
  const result = await cache.get('key', 'value');
  expect(result).toBe('value');
});

test('returns cached value', async () => {
  await cache.set('key', 'value');
  const result = await cache.get('key');
  expect(result).toBe('value');
});
