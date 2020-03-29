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

const DownloadFramework = require('../../lib/RuntimeVersion.js');
const fetchMock = require('fetch-mock').sandbox();
const fs = require('fs');
const os = require('os');
const path = require('path');

const fakeFiles = {
  'version.txt': '2003261442330',
  'v0/amp-geo-0.1.js': 'd=/^(\\w{2})?\\s*/.exec("us                          ")',
  'v0/examples/version.txt': '2003261442330',
};
fakeFiles['files.txt'] = Object.keys(fakeFiles).join('\n');

describe('DownloadFramework', () => {
  let downloadFramework;
  let dest;

  beforeEach(() => {
    downloadFramework = new DownloadFramework(fetchMock);
    dest = path.join(os.tmpdir(), 'amp-framework-test');
  });

  afterEach(() => {
    if (fs.existsSync(dest) && fs.lstatSync(dest).isDirectory()) {
      fs.rmdirSync(dest, {recursive: true});
    }
  });

  describe('getFramework', () => {
  });
});
