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

'use strict';

const fetch = require('node-fetch');
const {promisify} = require('util');
const {readFile} = require('fs');
const {URL} = require('url');
const readFileAsync = promisify(readFile);

async function loadUrlOrFile(urlOrPath) {
  if (!urlOrPath) {
    throw new Error('Missing URL or file path');
  }
  let isFile = true;
  try {
    const url = new URL(urlOrPath);
    isFile = !url.protocol.startsWith('http');
  } catch (err) {
    // not a valid URL
  }
  if (isFile) {
    return readFileAsync(urlOrPath, 'utf-8');
  } else {
    const response = await fetch(urlOrPath);
    return response.text();
  }
}

module.exports = {
  loadUrlOrFile,
};
