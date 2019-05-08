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

const {AMP_CACHE_HOST, appendRuntimeVersion} = require('../AmpConstants.js');

const V0_CSS = 'v0.css';
const V0_CSS_URL = AMP_CACHE_HOST + '/' + V0_CSS;

/**
 * AmpBoilerplateTransformer - This DOM transformer adds
 * https://cdn.ampproject.org/v0.css if server-side-rendering is applied
 * (known by the presence of <style amp-runtime> tag). AMP runtime css (v0.css)
 * will always be inlined as it'll get automatically updated to the latest version
 * once the AMP runtime has loaded.
 */
class AmpBoilerplateTransformer {
  constructor(config) {
    this.fetch_ = config.fetch;
    this.runtimeVersion_ = config.runtimeVersion;
    this.log_ = config.log.tag('AmpBoilerplateTransformer');
  }

  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    if (!head) {
      return; // invalid doc
    }
    // amp-runtime is added by server-side-rendering
    const ampRuntimeStyle = this._findAmpRuntimeStyle(head);
    if (!ampRuntimeStyle) {
      return; // keep existing boilerplate
    }
    return this._addStaticCss(tree, ampRuntimeStyle, params);
  }

  _findAmpRuntimeStyle(head) {
    let node = head.firstChild;
    while (node) {
      if (node.hasAttribute('amp-runtime')) {
        return node;
      }
      node = node.nextSibling;
    }
    return null;
  }

  async _addStaticCss(tree, node, params) {
    // we can always inline v0.css as the AMP runtime will take care of keeping v0.css in sync
    try {
      return this._inlineCss(node, params.ampRuntimeVersion);
    } catch (error) {
      this.log_.error(error);
      this._linkCss(tree, node);
    }
  }

  _linkCss(tree, node) {
    const cssStyleNode = tree.createElement('link');
    cssStyleNode.attribs = {
      rel: 'stylesheet',
      href: V0_CSS_URL,
    };
    node.parent.insertBefore(cssStyleNode, node);
  }

  async _inlineCss(node, version) {
    // use version passed in via params if available
    // otherwise fetch the current prod version
    let v0CssUrl;
    if (version) {
      v0CssUrl = appendRuntimeVersion(AMP_CACHE_HOST, version) + '/' + V0_CSS;
    } else {
      v0CssUrl = V0_CSS_URL;
      version = await this.runtimeVersion_.currentVersion();
    }
    node.attribs['i-amphtml-version'] = version;

    // Fetch and inline contents of v0.css
    const response = await this.fetch_(v0CssUrl);
    if (!response.ok) {
      throw new Error(`Could not inline v0.css. Request to ${v0CssUrl} failed with status ` +
          `${response.status}.`);
    }
    const body = await response.text();
    node.insertText(body);
  }
}

module.exports = AmpBoilerplateTransformer;
