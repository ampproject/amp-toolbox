/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
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

/**
 * LinkRewriter for making all anchor tags point to the reverse-proxy
 * instead of the underlying domain.
 */

class LinkRewriter {
  /**
   * @param {!../index.js.ConfigDef} config
   */
  constructor(config) {
    /** @type {../index.js.ConfigDef} */
    this.config = config;
  }

  element(element) {
    if (!this.config.proxy) {
      return;
    }

    const {origin, worker} = this.config.proxy;
    const href = element.getAttribute('href');
    if (this.config.MODE === 'dev') {
      element.setAttribute(
        'href',
        href.replace(origin, 'localhost:8787').replace('https://', 'http://')
      );
      return;
    }
    element.setAttribute('href', href.replace(origin, worker));
  }
}

class DocTagger {
  element(el) {
    el.setAttribute('data-cfw', '');
  }
}

module.exports = {LinkRewriter, DocTagger};
