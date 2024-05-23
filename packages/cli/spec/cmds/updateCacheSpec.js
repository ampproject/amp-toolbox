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
const MockLogger = require('../helpers/MockLogger');

describe('update-cache', () => {
  const mockLogger = new MockLogger();

  afterEach(() => {
    mockLogger.clear();
  });

  it('Display Error if URL is missing', async () => {
    try {
      await updateCacheCmd({_: []}, mockLogger);
      throw new Error('Expected Promise to be Rejected');
    } catch (err) {
      expect(err.message).toBe('Missing URL');
    }
  });

  it('Displays an Error if privateKey is unavailable', async () => {
    try {
      await updateCacheCmd({_: ['', 'https://www.example.com']}, mockLogger);
      throw new Error('Expected Promise to be Rejected');
    } catch (err) {
      expect(err.message).toBe('./privateKey.pem does not exist');
    }
  });

  it('Displays an Error if privateKey is invalid', async () => {
    const args = {
      _: ['', 'https://www.example.com'],
      privateKey: __dirname + '/invalidKey.pem',
    };

    try {
      await updateCacheCmd(args, mockLogger);
      throw new Error('Expected Promise to be Rejected');
    } catch (err) {
      expect(err.message).toBe(
        'Error generating cache invalidation URL with init failed:Error: not supported argument'
      );
    }
  });
});
