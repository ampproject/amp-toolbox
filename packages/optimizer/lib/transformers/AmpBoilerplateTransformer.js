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

const {
  insertText,
  hasAttribute,
  firstChildByTag,
} = require('../NodeUtils');

/**
 * AmpBoilerplateTransformer - This DOM transformer adds
 * https://cdn.ampproject.org/v0.css if server-side-rendering is applied
 * (known by the presence of <style amp-runtime> tag). AMP runtime css (v0.css)
 * will always be inlined as it'll get automatically updated to the latest version
 * once the AMP runtime has loaded.
 */
class AmpBoilerplateTransformer {
  constructor(config) {
    this.log_ = config.log.tag('AmpBoilerplateTransformer');
  }

  transform(root, params) {
    const html = firstChildByTag(root, 'html');
    const head = firstChildByTag(html, 'head');
    if (!head) {
      return; // invalid doc
    }
    // amp-runtime is added by server-side-rendering
    const ampRuntimeStyle = this._findAmpRuntimeStyle(head);
    if (!ampRuntimeStyle) {
      return; // keep existing boilerplate
    }
    return this._addStaticCss(ampRuntimeStyle, params);
  }

  _findAmpRuntimeStyle(head) {
    let node = head.firstChild;
    while (node) {
      if (hasAttribute(node, 'amp-runtime')) {
        return node;
      }
      node = node.nextSibling;
    }
    return null;
  }

  async _addStaticCss(node, params) {
    // we can always inline v0.css as the AMP runtime will take care of keeping v0.css in sync
    node.attribs['i-amphtml-version'] = params.ampRuntimeVersion;
    insertText(node, params.ampRuntimeCss);
  }
}

module.exports = AmpBoilerplateTransformer;
