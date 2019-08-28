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

const {calculateHash} = require('@ampproject/toolbox-script-csp');

/**
 * AmpScriptCsp - adds CSP for amp-script.
 *
 * Currently only supports inline scripts.
 *
 */
class AmpScriptCsp {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    const body = html.firstChildByTag('body');

    if (!head || !body) return;

    const cspMeta = this._findOrCreateCspMeta(tree, head);
    const existingCsp = (cspMeta.attribs.content || '').trim().split(/\s+/);
    const hashes = new Set(existingCsp);
    // ''.split(' ') results in [''] and not [], so we account for that case
    hashes.delete('');

    const inlineScripts = this._findAllInlineScripts(body);
    for (const script of inlineScripts) {
      const content = script.children[0].data;
      hashes.add(calculateHash(content));
    }

    const csp = Array.from(hashes).join(' ');
    if (csp === '') {
      cspMeta.remove();
      return;
    }
    cspMeta.attribs.content = csp;
  }

  _findAllInlineScripts(body) {
    const result = [];
    let node = body;
    while (node !== null) {
      if (node.tagName === 'script' && node.attribs.target === 'amp-script') {
        result.push(node);
      }
      node = node.nextNode();
    }
    return result;
  }

  _findOrCreateCspMeta(tree, head) {
    for (let node = head.firstChild; node !== null; node = node.nextSibling) {
      if (node.tagName === 'meta' && node.attribs.name === 'amp-script-src') {
        return node;
      }
    }
    const cspMeta = tree.createElement('meta', {
      name: 'amp-script-src',
    });
    head.appendChild(cspMeta);
    return cspMeta;
  }
}

module.exports = AmpScriptCsp;
