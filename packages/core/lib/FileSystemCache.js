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
const {rmdir, readdir, readFile, writeFile, unlink, existsSync, mkdirSync} = require('fs');
const {promisify} = require('util');
const crypto = require('crypto');

const path = require('path');
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const readdirAsync = promisify(readdir);
const rmdirAsync = promisify(rmdir);
const unlinkAsync = promisify(unlink);

class FileSystemCache {
  static get(
    opts = {
      baseDir: join(__dirname, '.cache'),
    }
  ) {
    return new FileSystemCache(opts);
  }

  constructor(opts) {
    this.opts = opts;
    this.cache = new Map();
  }

  async get(key, defaultValue = null) {
    let value = this.cache.get(key);
    if (value) {
      return value;
    }
    const cacheFile = this.createCacheFileName(key);
    try {
      const content = await readFileAsync(cacheFile, 'utf-8');
      value = JSON.parse(content);
      this.cache.set(key, value);
    } catch (error) {
      value = defaultValue;
    }
    return value;
  }

  async set(key, value) {
    const cacheFile = this.createCacheFileName(key);
    try {
      this.cache[key] = value;
      if (!existsSync(this.opts.baseDir)) {
        mkdirSync(this.opts.baseDir);
      }
      return writeFileAsync(cacheFile, JSON.stringify(value, null, ''), 'utf-8');
    } catch (e) {
      // could not write file
    }
  }

  async clear() {
    try {
      return await this.deleteDir_(this.opts.baseDir);
    } catch (e) {
      // doesn't exist
    }
  }

  createCacheFileName(key) {
    const keyHash = crypto.createHash('md5').update(key).digest('hex');
    return join(this.opts.baseDir, keyHash + '.json');
  }

  async deleteDir_(dir) {
    let entries = await readdirAsync(dir, {withFileTypes: true});
    await Promise.all(
      entries.map((entry) => {
        let fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? this.deleteDir_(fullPath) : unlinkAsync(fullPath);
      })
    );
    await rmdirAsync(dir);
  }
}

module.exports = FileSystemCache;
