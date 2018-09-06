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

const {OneBehindFetch} = require('amp-toolbox-core');

const CANARY_ENDPOINT = 'https://cdn.ampproject.org/diversions';
const RELEASE_ENDPOINT = 'https://cdn.ampproject.org/rtv/metadata';

/**
 * Queries cdn.ampproject.org for the lastest AMP runtime version. Uses a
 * stale-while-revalidate caching strategy to avoid refreshing the version.
 */
class RuntimeVersion {
  constructor(request = OneBehindFetch.create()) {
    this.request_ = request;
  }

  /**
   * Returns the version of the current AMP runtime release. Pass
   * <code>{canary: true}</code> to get the latest canary version.
   *
   * @param {Object} options - the options.
   * @param {bool} options.canary - true if canary should be returned.
   * @returns {Promise<Number>} a promise containing the current version
   */
  currentVersion(options = {}) {
    if (options.canary) {
      return this.fetchVersion_(CANARY_ENDPOINT, (data) => this.padVersionString(data[0]));
    }
    return this.fetchVersion_(RELEASE_ENDPOINT, (data) => data.amp_runtime_version);
  }

  /* PRIVATE */
  fetchVersion_(url, process) {
    return this.request_.get(url)
      .then((data) => {
        return this.padVersionString(process(data));
      });
  }

  padVersionString(version) {
    return this.pad(version, 15, 0);
  }

  pad(n, width, z) {
    z = z || '0';
    n = String(n);
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
}

module.exports = RuntimeVersion;
