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

'use strict';

/**
 * Removes duplicate preload header directives.
 *
 * To avoid wasted requests for preloaded resources strip references to duplicate
 * items.
 */
class PruneDuplicatePreloads {

  transform(tree) {
    const preloaded = new Set();
    const html = tree.root.firstChildByTag('html');
    if (!html) {
      return;
    }
    const head = html.firstChildByTag('head');
    if (!head) {
      return;
    }
    const childNodes = [];
    for (let node = head.firstChild; node !== null; node = node.nextSibling) {
      if (this._notPreloadLink(node)) {
        childNodes.push(node);
        continue;
      }
      if (!this._alreadyLoaded(node, preloaded)) {
        this._markPreloaded(node, preloaded);
        childNodes.push(node);
      }
      // skip adding elements which are already loaded.
    }
    // replace the child node list
    head.childNodes = childNodes;
  }

  _notPreloadLink(node) {
    if (node.tagName !== 'link') {
      return true;
    }
    if (!node.attribs || !node.attribs.rel) {
      return true;
    }
    return node.attribs.rel !== 'preload';
  }

  _alreadyLoaded(link, preloaded) {
    if (!link.attribs || !link.attribs.href) {
      return false;
    }
    return preloaded.has(link.attribs.href);
  }

  _markPreloaded(link, preloaded) {
    if (!link.attribs || !link.attribs.href) {
      return;
    }
    preloaded.add(link.attribs.href);
  }
}

module.exports = new PruneDuplicatePreloads();
