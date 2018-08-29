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

const updateCacheCmd = require('../../lib/cmds/updateCache');
const MockConsole = require('../helpers/MockConsole');

describe('update-cache', () => {
  const mockConsole = new MockConsole();

  afterEach(() => {
    mockConsole.clear();
  });

  it('Display Error if URL is missing', (done) => {
    updateCacheCmd({'_': []}, mockConsole)
      .then(() => done(new Error('Expected Promise to be Rejected')))
      .catch((err) => {
        expect(err.message).toBe('Missing URL');
        done();
      });
  });

  it('Displays an Error if privateKey is unavailable', (done) => {
    updateCacheCmd({'_': ['', 'https://www.example.com']}, mockConsole)
      .then(() => done(new Error('Expected Promise to be Rejected')))
      .catch((err) => {
        expect(err.message).toBe('./privateKey.pem does not exist');
        done();
      });
  });

  it('Displays an Error if privateKey is invalid', (done) => {
    const args = {
      '_': ['', 'https://www.example.com'],
      'privateKey': './spec/cmds/invalidKey.pem',
    };

    updateCacheCmd(args, mockConsole)
      .then(() => done(new Error('Expected Promise to be Rejected')))
      .catch((err) => {
        expect(err.message)
          .toBe('Error generating cache invalidation URL: init failed:not supported argument');
        done();
      });
  });
});
