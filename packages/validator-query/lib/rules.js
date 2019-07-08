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

const {oneBehindFetch} = require('@ampproject/toolbox-core');

const VALIDATOR_RULES_URL = 'https://cdn.ampproject.org/v0/validator.json';
const VALIDATOR_RULES_LOCAL = '../../validator.json';

const isNodeJs = typeof process !== 'undefined';

async function loadRemote(url) {
  const data = await oneBehindFetch(url);
  return req.json();
}

async function loadLocal() {
  if (!isNodeJs) {
    throw new Error('Local loading is not supported in browsers');
  }

  const {promisify} = require('util');
  const readFileAsync = promisify(require('fs').readFile);

  const data = await readFileAsync(getLocalPath());
  return JSON.parse(data);
}

async function loadDefault(url) {
  if (!isNodeJs) {
    return loadRemote(url);
  }

  const {existsSync} = require('fs');

  if (existsSync(getLocalPath())) {
    return loadLocal();
  }
  return loadRemote(url);
}

function getLocalPath() {
  const path = require('path');
  return path.join(__dirname, VALIDATOR_RULES_LOCAL);
}

async function load({source, url}) {
  switch (source) {
    case 'local':
      return loadLocal();
    case 'remote':
      return loadRemote(url);
    default:
      return loadDefault(url);
  }
}

module.exports = load;
