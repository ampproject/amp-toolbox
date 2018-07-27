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
    const preloaded = new Map();
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
      if (this._notHintLink(node)) {
        childNodes.push(node);
      } else if (!this._alreadyLoaded(node, preloaded)) {
        this._markPreloaded(node, preloaded);
        childNodes.push(node);
      }
    }
    // replace the child node list
    head.childNodes = childNodes;
  }

  _notHintLink(node) {
    if (node.tagName !== 'link') {
      return true;
    }
    if (!node.attribs || !node.attribs.rel) {
      return true;
    }
    if (!node.attribs || !node.attribs.href) {
      return true;
    }
    return ['dns-prefetch', 'preconnect', 'prefetch', 'preload', 'prerender']
        .indexOf(node.attribs.rel) === -1;
  }

  _alreadyLoaded(link, preloaded) {
    let rel = link.attribs.rel;
    let href = link.attribs.href;
    if (!preloaded.has(href)) {
      return false;
    }
    let relations = preloaded.get(href);
    return relations.has(rel);
  }

  _markPreloaded(link, preloaded) {
    let rel = link.attribs.rel;
    let href = link.attribs.href;
    if (!preloaded.has(href)) {
      preloaded.set(href, new Set());
    }
    let relations = preloaded.get(href);
    relations.add(rel);
  }
}

module.exports = new PruneDuplicatePreloads();
