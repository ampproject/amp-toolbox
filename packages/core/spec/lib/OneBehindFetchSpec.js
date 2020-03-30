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
'mode strict';

const oneBehindFetch = require('../../lib/oneBehindFetch.js');
const mockFetch = require('fetch-mock');
const nodeFetch = require('node-fetch');
const fetch = mockFetch.sandbox();

describe('oneBehindFetch', () => {
  beforeEach(() => {
    oneBehindFetch.setDelegate(fetch);
    oneBehindFetch.clearCache();
    fetch.reset();
  });
  afterEach(() => {
    oneBehindFetch.setDelegate(nodeFetch);
  });
  it('fetches new value', async () => {
    fetch.get('https://example.com', 'hello');
    const data = await oneBehindFetch('https://example.com');
    expect(await data.text()).toBe('hello');
  });
  it('uses a one behind caching model', async () => {
    fetch.once('https://example.com', 'hello');
    await oneBehindFetch('https://example.com');
    fetch.restore();
    fetch.once('https://example.com', 'world');
    let data = await oneBehindFetch('https://example.com');
    fetch.restore();
    fetch.once('https://example.com', 'world');
    expect(await data.text()).toBe('hello');
    data = await oneBehindFetch('https://example.com');
    expect(await data.text()).toBe('world');
  });
});
