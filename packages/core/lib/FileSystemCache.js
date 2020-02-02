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
'use strict';
const {join} = require('path');
const {readFile, writeFile, unlink} = require('fs');
const {promisify} = require('util');
const crypto = require('crypto');

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const deleteFileAsync = promisify(unlink);

const caches = new Map();

class FileSystemCache {
  static get(opts = {
    name: '.cache',
    baseDir: __dirname,
  }) {
    const cacheFile = join(opts.baseDir, `${opts.name}.json`);
    let cache = caches.get(cacheFile);
    if (!cache) {
      cache = new FileSystemCache(cacheFile);
      caches.set(cacheFile, cache);
    }
    return cache;
  }

  constructor(cacheFilePath) {
    this.cacheFile = cacheFilePath;
  }

  async get(key, defaultValue=null) {
    const cache = await this.loadCache();
    const keyHash = this.hash(key);
    return cache[keyHash] || defaultValue;
  }

  async set(key, value) {
    const cache = await this.loadCache();
    const keyHash = this.hash(key);
    cache[keyHash] = value;
    return this.saveCache();
  }

  async clear() {
    try {
      return await deleteFileAsync(this.cacheFile);
    } catch (e) {
      // doesn't exist
    }
  }

  async loadCache() {
    if (this.cache) {
      return this.cache;
    }
    try {
      const content = await readFileAsync(this.cacheFile, 'utf-8');
      this.cache = JSON.parse(content);
    } catch (error) {
      this.cache = {};
    }
    return this.cache;
  }

  saveCache() {
    writeFileAsync(this.cacheFile, JSON.stringify(this.cache, null, ''), 'utf-8');
  }

  hash(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }
}

module.exports = FileSystemCache;
