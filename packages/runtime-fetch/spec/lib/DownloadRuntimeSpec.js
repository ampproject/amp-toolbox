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

const DownloadRuntime = require('../../lib/DownloadRuntime.js');
const fetchMock = require('fetch-mock').sandbox();
const Readable = require('stream').Readable;
const crossFetch = require('cross-fetch');
const fse = require('fs-extra');
const os = require('os');
const path = require('path');

const defaultVersion = '2003261442330';
const defaultRtv = '01' + defaultVersion;
const defaultHost = 'https://cdn.ampproject.org';

// AMP runtime files with sample string contents
const fakeFiles = {
  'files.txt': '',
  'version.txt': defaultVersion,
  'v0/amp-geo-0.1.js': 'd=/^(\\w{2})?\\s*/.exec("                            ")',
  'v0/amp-geo-0.1.mjs': 'd=/^(\\w{2})?\\s*/.exec("us                          ")',
  'v0/amp-geo-latest.js': 'd=/^(\\w{2})?\\s*/.exec("us us-ca                    ")',
  'v0/amp-geo-latest.mjs': 'd=/^(\\w{2})?\\s*/.exec("fj fj-w                     ")',
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

describe('DownloadRuntime', () => {
  let downloadRuntime;
  let options;
  let mockResponses;

  beforeEach(() => {
    downloadRuntime = new DownloadRuntime(fetchMock, cacheListProvider, runtimeVersionProvider);

    options = {
      dest: fse.mkdtempSync(path.join(os.tmpdir(), 'amp-download-')),
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
    if (fse.existsSync(options.dest) && fse.lstatSync(options.dest).isDirectory()) {
      fse.removeSync(options.dest);
    }
  });

  describe('getRuntime', () => {
    it('downloads latest ampproject runtime by default', (done) => {
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadRuntime.getRuntime(options).then((ret) => {
        expect(ret.status).toBe(true);
        expect(ret.error).toBe('');
        expect(ret.count).toBe(Object.keys(fakeFiles).length);
        expect(ret.url).toBe(`${defaultHost}/rtv/${defaultRtv}/`);
        expect(ret.dest).toBe(path.join(options.dest, 'rtv', defaultRtv));
        expect(ret.rtv).toBe(defaultRtv);
        for (let filename of Object.keys(fakeFiles)) {
          filename = filename.split('/').join(path.sep);
          const filepath = path.join(options.dest, 'rtv', defaultRtv, filename);
          expect(fse.existsSync(filepath)).toBe(true);
        }
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
      downloadRuntime.getRuntime(options).then((ret) => {
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
      downloadRuntime.getRuntime(options).then((ret) => {
        expect(ret.status).toBe(true);
        expect(ret.url).toBe(`${defaultHost}/rtv/${rtv}/`);
        done();
      });
    });

    it('supports disabling destination dir clearing', (done) => {
      const testFileDir = path.join(options.dest, 'rtv', defaultRtv);
      const testFilePath = path.join(testFileDir, 'test-file.txt');
      fse.mkdirSync(testFileDir, {recursive: true});
      fse.closeSync(fse.openSync(testFilePath, 'w'));

      options['clear'] = false;
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadRuntime.getRuntime(options).then((ret) => {
        expect(ret.status).toBe(true);
        expect(fse.existsSync(testFilePath)).toBe(true);
        done();
      });
    });

    it('reverts amp-geo hotpatching', (done) => {
      const ampGeoFilePaths = [
        path.join(options.dest, 'rtv', defaultRtv, 'v0', 'amp-geo-0.1.js'), // indeterminate
        path.join(options.dest, 'rtv', defaultRtv, 'v0', 'amp-geo-0.1.mjs'), // country
        path.join(options.dest, 'rtv', defaultRtv, 'v0', 'amp-geo-latest.js'), // country + subdivision
      ];
      Object.keys(mockResponses).forEach((filename) => {
        fetchMock.get(`${defaultHost}/${filename}`, mockResponses[filename]);
        fetchMock.get(`${defaultHost}/rtv/${defaultRtv}/${filename}`, mockResponses[filename]);
      });
      downloadRuntime.getRuntime(options).then((ret) => {
        expect(ret.status).toBe(true);
        const readFilePromises = ampGeoFilePaths.map((filePath) => fse.readFile(filePath, 'utf8'));
        Promise.all(readFilePromises).then((readFileResults) => {
          readFileResults.forEach((contents) => {
            expect(contents).toContain('{{AMP_ISO_COUNTRY_HOTPATCH}}');
          });
          done();
        });
      });
    });
  });
});
