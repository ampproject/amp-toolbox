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

const RuntimeData = require('../../lib/RuntimeData');
const {existsSync, readFileSync, writeFileSync, unlinkSync} = require('fs');
const validationRules = readFileSync(__dirname + '/../assets/validatorRules.json', 'utf-8');

const fetchMock = require('fetch-mock');
const fetch = fetchMock.sandbox()
    .mock('https://cdn.ampproject.org/rtv/metadata', {
      body: {
        'ampRuntimeVersion': '012003101714470',
        'ampCssUrl': 'https://cdn.ampproject.org/rtv/012003101714470/v0.css',
        'ltsRuntimeVersion': '012002251816300',
        'ltsCssUrl': 'https://cdn.ampproject.org/rtv/012002251816300/v0.css',
      },
      headers: {
        'cache-control': 'max-age=15',
      },
    })
    .mock('https://cdn.ampproject.org/rtv/012003101714470/v0.css', '/* v0.css */')
    .mock(
        'https://cdn.ampproject.org/v0/validator.json',
        validationRules,
    );

const CACHE_PATH = __dirname + '/.testCache.json';

beforeEach(() => {
  if (existsSync(CACHE_PATH)) {
    unlinkSync(CACHE_PATH);
  }
});

test('fetches runtime version', async () => {
  const data = await fetchRuntimeData();
  expect(data.ampRuntimeVersion).toBe('012003101714470');
});

test('fetches runtime css', async () => {
  const data = await fetchRuntimeData();
  expect(data.ampRuntimeCss).toBe('/* v0.css */');
});

test('fetches validation rules', async () => {
  const data = await fetchRuntimeData();
  const ampCarousel = data.validatorRules.getExtension('AMP4EMAIL', 'amp-carousel');
  expect(ampCarousel.name).toBe('amp-carousel');
});

test('fetches data from cache', async () => {
  const cachedData = {
    ampRuntimeVersion: '1234',
    ampRuntimeCss: 'css',
    validatorRules: validationRules,
    maxAge: {'timestampInMs_': Date.now(), 'value': 150},
  };
  writeFileSync(CACHE_PATH, JSON.stringify(cachedData), 'utf-8');

  const data = await fetchRuntimeData();
  expect(data.ampRuntimeVersion).toBe('1234');
  expect(data.ampRuntimeCss).toBe('css');
  const ampCarousel = data.validatorRules.getExtension('AMP4EMAIL', 'amp-carousel');
  expect(ampCarousel.name).toBe('amp-carousel');
});

test('fetches data from cache - expired', async () => {
  const cachedData = {
    ampRuntimeVersion: '1234',
    ampRuntimeCss: 'css',
    validatorRules: validationRules,
    maxAge: {'timestampInMs_': 1584744348874, 'value': 15},
  };
  writeFileSync(CACHE_PATH, JSON.stringify(cachedData), 'utf-8');

  const data = await fetchRuntimeData();
  expect(data.ampRuntimeVersion).not.toBe('1234');
});

test('writes data to cache', async () => {
  await fetchRuntimeData();
  const data = JSON.parse(readFileSync(CACHE_PATH, 'utf-8'));
  expect(data.ampRuntimeVersion).toBe('012003101714470');
});

function fetchRuntimeData() {
  return new RuntimeData({
    fetch,
    cachePath: CACHE_PATH,
  }).fetch();
}
