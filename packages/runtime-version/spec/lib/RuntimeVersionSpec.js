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

const RuntimeVersion = require('../../lib/RuntimeVersion.js');

describe('RuntimeVersion', () => {
  const runtimeVersion = new RuntimeVersion();

  describe('currentVersion', () => {
    it('returns release version by default', (done) => {
      runtimeVersion.currentVersion().then((version) => {
        expect(version).toMatch(/[0-9]+/);
        done();
      });
    });
    it('returns canary version if specified via option', (done) => {
      runtimeVersion.currentVersion({canary: true}).then((version) => {
        expect(version).toMatch(/[0-9]+/);
        done();
      });
    });
    it('pads release version to 15 chars', (done) => {
      runtimeVersion.currentVersion().then((version) => {
        expect(version.length).toBe(15);
        done();
      });
    });
    it('pads canary version to 15 chars', (done) => {
      runtimeVersion.currentVersion({canary: true}).then((version) => {
        expect(version.length).toBe(15);
        done();
      });
    });
  });
});
