/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

const https = require('https');
const {promisify} = require('util');
const fs = require('fs');
const path = require('path');
const readFileAsync = promisify(fs.readFile);

const VALIDATOR_RULES_LOCAL = path.join(__dirname, '../../validator.json');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
        .get(url, (res) => {
          if (res.statusCode != 200) {
            reject(new Error(`Got status code ${res.statusCode}`));
            return;
          }

          let data = '';
          res.on('data', (buffer) => {
            data += buffer;
          });
          res.on('end', () => {
            resolve(data);
          });
        })
        .on('error', (err) => {
          reject(err);
        });
  });
}

async function loadRemote(url) {
  const data = await fetch(url);
  return JSON.parse(data);
}

async function loadLocal() {
  const data = await readFileAsync(VALIDATOR_RULES_LOCAL);
  return JSON.parse(data);
}

async function load({source, url}) {
  switch (source) {
    case 'local':
      return loadLocal();
    case 'remote':
      return loadRemote(url);
    default:
      if (fs.existsSync(VALIDATOR_RULES_LOCAL)) {
        return loadLocal();
      }
      return loadRemote();
  }
}

module.exports = load;
