/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
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

const {nextNode, firstChildByTag, setAttribute} = require('../NodeUtils');
const {skipNodeAndChildren} = require('../HtmlDomHelper');
const {isTemplate} = require('../AmpConstants');

/**
 * Allow the runtime to detect amp-bimd elements more efficiently by adding `i-amphtml-binding` attributes to elements that have bindings.
 */
class OptimizeAmpBind {
  constructor(config) {
    this.log_ = config.log.tag('OptimizeAmpBind');
    this.enabled_ = config.optimizeAmpBind !== false;
  }

  transform(root) {
    if (!this.enabled_) return;

    const html = firstChildByTag(root, 'html');
    if (!html) return;

    const head = firstChildByTag(html, 'head');
    if (!head) return;

    if (!hasAmpBindScriptNode(head)) return;

    setAttribute(html, 'i-amphtml-binding', '');

    for (let node = html; node !== null; node = nextNode(node)) {
      if (isTemplate(node)) {
        node = skipNodeAndChildren(node);
        continue;
      }

      const {attribs} = node;
      if (!attribs) continue;

      for (const name in attribs) {
        if (name.startsWith('data-amp-bind-') || (name.startsWith('[') && name.endsWith(']'))) {
          setAttribute(node, 'i-amphtml-binding', '');
          break;
        }
      }
    }
  }
}

function hasAmpBindScriptNode(head) {
  for (let node = head.firstChild; node !== null; node = node.nextSibling) {
    if (node.tagName !== 'script') continue;
    if (!node.attribs) continue;
    if (node.attribs['custom-element'] !== 'amp-bind') continue;
    return true;
  }
  return false;
}

/** @module OptimizeAmpBind */
module.exports = OptimizeAmpBind;
