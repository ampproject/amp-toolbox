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

const OptimizeCmd = require('../../lib/cmds/optimize.js');
const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const MockLogger = require('../helpers/MockLogger');

describe('optimize', () => {
  let input;
  let inputUrl;
  let mockLogger;
  let mockLoader;

  beforeEach(async () => {
    mockLogger = new MockLogger();
    mockLoader = (url) => {
      inputUrl = url;
      return input;
    };
    const optimizeCmd = new OptimizeCmd(AmpOptimizer.create(), mockLoader);
    input = '<html amp></html>';
    await optimizeCmd.run({_: ['', 'https://example.com']}, mockLogger);
  });

  it('runs optimizer', () => {
    expect(mockLogger.getLogs().startsWith('<!doctype html><html amp i-amphtml-layout')).toBe(true);
  });
  it('loads url / path', () => {
    expect(inputUrl).toBe('https://example.com');
  });
});
