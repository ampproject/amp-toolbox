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
const log = require('amp-toolbox-core').log.tag('AMP Runtime Version');

const RUNTIME_METADATA_ENDPOINT = 'https://cdn.ampproject.org/rtv/metadata';

/**
 * Queries https://cdn.ampproject.org/rtv/metadata for the lastest AMP runtime version. Uses a
 * stale-while-revalidate caching strategy to avoid refreshing the version.
 *
 * More details: https://cdn.ampproject.org/rtv/metadata returns the following metadata:
 *
 * <pre>
 * {
 *    "ampRuntimeVersion": "CURRENT_PROD",
 *    "ampCssUrl": "https://cdn.ampproject.org/rtv/CURRENT_PROD/v0.css",
 *    "canaryPercentage": "0.1",
 *    "diversions": [
 *      "CURRENT_OPTIN",
 *      "CURRENT_1%",
 *      "CURRENT_CONTROL"
 *    ]
 *  }
 *  </pre>
 *
 *  where:
 *
 *  <ul>
 *    <li> CURRENT_OPTION: is when you go to https://cdn.ampproject.org/experiments.html and toggle "dev-channel". It's the earliest possible time to get new code.</li>
 *    <li> CURRENT_1%: 1% is the same code as opt-in that we're now comfortable releasing to 1% of the population.</li>
 *    <li> CURRENT_CONTROL is the same thing as production, but with a different URL. This is to compare experiments against, since prod's immutable caching would affect metrics.</li>
 *  </ul>
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
  async currentVersion(options = {}) {
    const data = await this.fetchVersion_(RUNTIME_METADATA_ENDPOINT);
    let version;
    if (options.canary) {
      version = data.diversions[0];
      log.debug('canary version', version);
    } else {
      version = data.ampRuntimeVersion;
      log.debug('prod version', version);
    }
    return this.padVersionString_(version);
  }

  /* PRIVATE */
  fetchVersion_(url) {
    return this.request_.get(url);
  }

  padVersionString_(version) {
    return this.pad_(version, 15, 0);
  }

  pad_(n, width, z) {
    z = z || '0';
    n = String(n);
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }
}

module.exports = RuntimeVersion;
