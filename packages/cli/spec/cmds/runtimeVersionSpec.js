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

const runtimeVersionCmd = require('../../lib/cmds/runtimeVersion.js');
const MockLogger = require('../helpers/MockLogger');

describe('runtime-version', () => {
  const mockLogger = new MockLogger();

  it('prints the current amp runtime version', (done) => {
    mockLogger.clear();
    return runtimeVersionCmd({}, mockLogger)
      .then(() => {
        const output = mockLogger.getLogs();
        expect(output.length).toBe(15);
        done();
      })
      .catch((e) => done.fail(e));
  });
});
