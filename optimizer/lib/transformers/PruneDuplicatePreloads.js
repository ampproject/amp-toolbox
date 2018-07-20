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
      
  transform(tree, params) {
    const preloaded = new Set();
    const html = tree.root.firstChildByTag('html');
    if ('undefined' == typeof html) {
      return;
    }
    const head = html.firstChildByTag('head');
    if ('undefined' == typeof head) {
      return;
    }
    const childNodes = new Array();
    for (let node = head.firstChild; null != node; node = node.nextSibling) {
      if (this.notPreloadLink(node)) {
        childNodes.push(node);
        continue;
      }
      if(!this.alreadyLoaded(node, preloaded)) {
        this.markPreloaded(node, preloaded);
        childNodes.push(node);
      }
      // skip adding elements which are already loaded.
    }
    // replace the child node list
    head.childNodes = childNodes;
  }

  notPreloadLink(node) {
    if ('link' !== node.tagName) {
      return true;
    }
    if ('undefined' == typeof node.attribs
        || 'undefined' == typeof node.attribs.rel) {
      return true;
    }
    return 'preload' !== node.attribs.rel;
  }

  alreadyLoaded(link, preloaded) {
    if ('undefined' == typeof link.attribs
        || 'undefined' == typeof link.attribs.href) {
      return false;
    }
    return preloaded.has(link.attribs.href);
  }

  markPreloaded(link, preloaded) {
    if ('undefined' == typeof link.attribs
        || 'undefined' == typeof link.attribs.href) {
      return;
    }
    preloaded.add(link.attribs.href)
  }

  pruneChild(prune, head) {
    for (let i = 0; i < head.length; i++) {
      if (head[i] === prune) {
        head.splice(i, 1);
        return;
      }
    }
  }
}

module.exports = new PruneDuplicatePreloads();
