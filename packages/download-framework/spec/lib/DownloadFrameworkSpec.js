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

const DownloadFramework = require('../../lib/DownloadFramework.js');
const fetchMock = require('fetch-mock').sandbox();
const Readable = require('stream').Readable;
const crossFetch = require('cross-fetch');
const fs = require('fs');
const os = require('os');
const path = require('path');

const defaultVersion = '2003261442330';
const defaultRtv = '01' + defaultVersion;
const defaultHost = 'https://cdn.ampproject.org';

// AMP framework files with sample string contents
const fakeFiles = {
  'files.txt': '',
  'version.txt': defaultVersion,
  'v0/amp-geo-0.1.js': 'd=/^(\\w{2})?\\s*/.exec("us                          ")',
  'v0/examples/version.txt': defaultVersion,
};
fakeFiles['files.txt'] = Object.keys(fakeFiles).join('\n');

// Mock RuntimeVersion and CacheList
const runtimeVersionProvider = {
  currentVersion: () => defaultRtv,
};
const cacheListProvider = {
  get: () => {
    return {cacheDomain: defaultHost.replace('https://', '')};
  },
};

describe('DownloadFramework', () => {
  let downloadFramework;
  let options;
  let mockResponses;

  beforeEach(() => {
    downloadFramework = new DownloadFramework(fetchMock, cacheListProvider, runtimeVersionProvider);

    options = {
      dest: path.join(os.tmpdir(), 'amp-framework-test'),
    };

    // Prepare Response objects for fetch mocks
    mockResponses = {};
    Object.keys(fakeFiles).forEach((filename) => {
      const readable = new Readable();
      readable.push(fakeFiles[filename]);
      readable.push(null);

      mockResponses[filename] = new crossFetch.Response(readable);
    });
  });

  afterEach(() => {
    fetchMock.reset();
    if (fs.existsSync(options.dest) && fs.lstatSync(options.dest).isDirectory()) {
      fs.rmdirSync(options.dest, {recursive: true});
    }
  });

  describe('getFramework', () => {
    it('downloads latest ampproject framework by default', (done) => {
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadFramework.getFramework(options)
          .then((ret) => {
            expect(ret.status).toBe(true);
            expect(ret.error).toBe('');
            expect(ret.count).toBe(Object.keys(fakeFiles).length);
            expect(ret.url).toBe(`${defaultHost}/rtv/${defaultRtv}/`);
            expect(ret.dest).toBe(options.dest);
            expect(ret.rtv).toBe(defaultRtv);
            done();
          });
    });

    it('supports alternate hosts', (done) => {
      const host = 'https://example.com/amp';
      options['ampUrlPrefix'] = host;
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${host}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${host}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadFramework.getFramework(options)
          .then((ret) => {
            expect(ret.status).toBe(true);
            expect(ret.url).toBe(`${host}/rtv/${defaultRtv}/`);
            done();
          });
    });

    it('supports manually specified runtime version', (done) => {
      const rtv = '123';
      options['rtv'] = rtv;
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${rtv}/${filename}`, mockResponses[filename]);
      });
      downloadFramework.getFramework(options)
          .then((ret) => {
            expect(ret.status).toBe(true);
            expect(ret.url).toBe(`${defaultHost}/rtv/${rtv}/`);
            done();
          });
    });

    it('supports disabling destination dir clearing', (done) => {
      const testFilePath = path.join(options.dest, 'test-file.txt');
      fs.mkdirSync(options.dest, {recursive: true});
      fs.closeSync(fs.openSync(testFilePath, 'w'));

      options['clear'] = false;
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadFramework.getFramework(options)
          .then((ret) => {
            expect(ret.status).toBe(true);
            expect(fs.existsSync(testFilePath)).toBe(true);
            done();
          });
    });

    it('reverts amp-geo hotpatching', (done) => {
      const ampGeoPath = path.join(options.dest, 'v0', 'amp-geo-0.1.js');
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadFramework.getFramework(options)
          .then((ret) => {
            expect(ret.status).toBe(true);
            fs.readFile(ampGeoPath, 'utf8', (err, contents) => {
              expect(contents).toContain('{{AMP_ISO_COUNTRY_HOTPATCH}}');
              done();
            });
          });
    });
  });
});
