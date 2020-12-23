/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

const {loadUrlOrFile} = require('../lib/io');
const path = require('path');

test('loads url', async () => {
  expect(await loadUrlOrFile('https://amp.dev/documentation/examples/api/echo?hello=world')).toBe(
    'Requests must set content-type=application/json'
  );
});
test('loads file', async () => {
  expect(await loadUrlOrFile(path.join(__dirname, 'test-data/hello.txt'))).toBe('hello\n');
});
test('fails if url is missing', async () => {
  let error;
  try {
    await loadUrlOrFile('');
  } catch (e) {
    error = e;
  }
  expect(error).toEqual(new Error('Missing URL or file path'));
});
