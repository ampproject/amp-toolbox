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
const fetchMock = require('fetch-mock').sandbox();

const defaultHost = 'https://cdn.ampproject.org';
const defaultMetadata = {
  ampRuntimeVersion: '012004030010070',
  diversions: ['002004012111560'],
  ltsRuntimeVersion: '012002251816300',
};

describe('RuntimeVersion', () => {
  let runtimeVersion;

  beforeEach(() => {
    runtimeVersion = new RuntimeVersion(fetchMock);

    // Set unmatched fetch-mock responses to "not found"
    fetchMock.catch(404);
  });

  afterEach(() => {
    fetchMock.reset();
  });

  describe('currentVersion', () => {
    it('returns release version by default', (done) => {
      fetchMock.get(`${defaultHost}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion().then((rtv) => {
        expect(rtv).toBe(defaultMetadata.ampRuntimeVersion);
        done();
      });
    });
    it('returns canary version if specified via option', (done) => {
      fetchMock.get(`${defaultHost}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion({canary: true}).then((rtv) => {
        expect(rtv).toBe(defaultMetadata.diversions[0]);
        done();
      });
    });
    it('returns lts version if specified via option', (done) => {
      fetchMock.get(`${defaultHost}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion({lts: true}).then((rtv) => {
        expect(rtv).toBe(defaultMetadata.ltsRuntimeVersion);
        done();
      });
    });
    it('supports getting release version from alternate host', (done) => {
      const host = 'https://example.com/amp';
      fetchMock.get(`${host}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion({ampUrlPrefix: host}).then((rtv) => {
        expect(rtv).toBe(defaultMetadata.ampRuntimeVersion);
        done();
      });
    });
    it('supports getting canary version from alternate host', (done) => {
      const host = 'https://example.com/amp';
      fetchMock.get(`${host}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion({ampUrlPrefix: host, canary: true}).then((rtv) => {
        expect(rtv).toBe(defaultMetadata.diversions[0]);
        done();
      });
    });
    it('supports getting release version from host without metadata endpoint', (done) => {
      const host = 'https://example.com/amp';
      const version = defaultMetadata.ampRuntimeVersion.substring(2);
      fetchMock.get(`${host}/version.txt`, version);
      runtimeVersion.currentVersion({ampUrlPrefix: host}).then((rtv) => {
        expect(rtv).toBe(defaultMetadata.ampRuntimeVersion);
        done();
      });
    });
    it('gracefully returns undefined if version not found', (done) => {
      runtimeVersion.currentVersion().then((rtv) => {
        expect(rtv).toBeUndefined();
        done();
      });
    });
    it('does not support simultaneous use of lts and canary flags', (done) => {
      fetchMock.get(`${defaultHost}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion({canary: true, lts: true}).catch((error) => {
        expect(error.message).toMatch(/not compatible/);
        done();
      });
    });
    it('does not support relative URL for custom host', (done) => {
      const host = '/amp';
      fetchMock.get(`${host}/rtv/metadata`, defaultMetadata);
      runtimeVersion.currentVersion({ampUrlPrefix: host}).catch((error) => {
        expect(error.message).toMatch(/absolute URL/);
        done();
      });
    });
  });
});
