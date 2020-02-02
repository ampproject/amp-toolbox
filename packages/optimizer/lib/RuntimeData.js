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
'use strict';

const fetch = require('cross-fetch');
const {MaxAge} = require('@ampproject/toolbox-core');
const validatorRules = require('@ampproject/toolbox-validator-rules');
const {AMP_METADATA, AMP_VALIDATION_RULES_URL} = require('./AmpConstants');
const {exists, readFile, writeFile} = require('fs');
const {promisify} = require('util');
const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const existsFileAsync = promisify(exists);

let RUNTIME_DATA_SINGLETON;

const DEFAULT_CACHE_PATH = __dirname + '/.runtimeData.json';

class RuntimeData {
  static fetch(opts = {}) {
    opts.fetch = opts.fetch || fetch;
    opts.cachePath = opts.cachePath || DEFAULT_CACHE_PATH;
    if (!RUNTIME_DATA_SINGLETON) {
      RUNTIME_DATA_SINGLETON = new RuntimeData(opts);
    }
    return RUNTIME_DATA_SINGLETON.fetch();
  }

  constructor(opts) {
    this.opts = opts;
    this.rawDataPromise = this.loadFromFileSystem();
  }

  async fetch() {
    const rawData = await this.rawDataPromise;
    if (this.isExpired(rawData)) {
      await this.updateRuntimeData(rawData);
    }
    return {
      ampRuntimeVersion: rawData.ampRuntimeVersion,
      ampRuntimeCss: rawData.ampRuntimeCss,
      validatorRules: await validatorRules.fetch({
        cache: rawData.validatorRules,
      }),
    };
  }

  /**
   * @private
   */
  isExpired(rawData) {
    if (!rawData.maxAge) {
      return true;
    }
    const maxAge = new MaxAge(rawData.maxAge.timestampInMs_, rawData.maxAge.value);
    return maxAge.isExpired();
  }

  /**
   * @private
   */
  async updateRuntimeData(rawData) {
    await Promise.all([
      this.fetchRuntimeData(rawData),
      this.fetchValidatorRules(rawData),
    ]);
    this.rawDataPromise = Promise.resolve(rawData);
    await writeFileAsync(this.opts.cachePath, JSON.stringify(rawData), 'utf-8');
  }

  /**
   * @private
   */
  async loadFromFileSystem() {
    let rawData = {};
    if (await existsFileAsync(this.opts.cachePath)) {
      try {
        const content = await readFileAsync(this.opts.cachePath, 'utf-8');
        rawData = JSON.parse(content);
      } catch (error) {
        console.error(error);
      }
    }
    return rawData;
  }

  /**
   * @private
   */
  async fetchRuntimeData(rawData) {
    const {cacheControl, json} = await this.fetchJson(AMP_METADATA);
    rawData.maxAge = MaxAge.parse(cacheControl);
    rawData.ampRuntimeVersion = json.ampRuntimeVersion;
    rawData.ampRuntimeCss = await this.fetchText(json.ampCssUrl);
  }

  /**
   * @private
   */
  async fetchValidatorRules(rawData) {
    rawData.validatorRules = (await this.fetchJson(AMP_VALIDATION_RULES_URL)).json;
  }

  /**
   * @private
   */
  async fetchJson(url) {
    const response = await this.opts.fetch(url);
    if (!response.ok) {
      throw new Error(`Fetching ${url} failed with code ${response.status}`);
    }
    return {
      cacheControl: response.headers.get('cache-control'),
      json: await response.json(),
    };
  }

  /**
   * @private
   */
  async fetchText(url) {
    const response = await this.opts.fetch(url);
    if (!response.ok) {
      throw new Error(`Fetching ${url} failed with code ${response.status}`);
    }
    return response.text();
  }
}

module.exports = RuntimeData;
