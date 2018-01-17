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

const {join} = require('path');

const AMP_CACHE_PREFIX = 'https://cdn.ampproject.org';

/**
 * RewriteAmpUrls - rewrites AMP runtime URLs.
 *
 * This transformer supports two options:
 *
 * <ul>
 *   <ol><strong>ampRuntimeVersion:</strong> specifies a
 *   <a href=https://github.com/ampproject/amp-toolbox/tree/master/runtime-version">
 *   specific version</a> of the AMP runtime. For example: <code>ampRuntimeVersion:
 *   "001515617716922"</code> will result in AMP runtime URLs being re-written
 *   from <code>https://cdn.ampproject.org/v0.js</code> to
 *   <code>https://cdn.ampproject.org/rtv/001515617716922/v0.js</code>.</ol>
 *   <ol><strong>ampUrlPrefix:</strong> specifies an URL prefix for AMP runtime
 *   URLs. For example: <code>ampUrlPrefix: "/amp"</code> will result in AMP runtime
 *   URLs being re-written from <code>https://cdn.ampproject.org/v0.js</code> to
 *   <code>/amp/v0.js</code>. This option is experimental and not recommended.</ol>
 * </ul>
 *
 * Both parameters are optional. If no option is provided, runtime URLs won't be
 * re-written. You can combine both parameters to rewrite AMP runtime URLs
 * to versioned URLs on a different origin.
 *
 * This transformer also adds a preload header for v0.js to trigger HTTP/2
 * push for CDNs (see https://www.w3.org/TR/preload/#server-push-(http/2)).
 */
class RewriteAmpUrls {
  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    if (!head) return;

    let ampUrlPrefix = params.ampUrlPrefix || AMP_CACHE_PREFIX;
    if (params.ampRuntimeVersion) {
      ampUrlPrefix = join(ampUrlPrefix, 'rtv', params.ampRuntimeVersion);
    }

    let node = head.firstChild;
    while (node) {
      if (node.tagName === 'script' && this._usesAmpCacheUrl(node.attribs.src)) {
        node.attribs.src = this._replaceUrl(node.attribs.src, ampUrlPrefix);
        this._addPreload(tree, head, node, node.attribs.src, 'script');
      } else if (node.tagName === 'link' &&
                  node.attribs.rel === 'stylesheet' &&
                  this._usesAmpCacheUrl(node.attribs.href)) {
        node.attribs.href = this._replaceUrl(node.attribs.href, ampUrlPrefix);
        this._addPreload(tree, head, node, node.attribs.href, 'style');
      }
      node = node.nextSibling;
    }
  }

  _usesAmpCacheUrl(url) {
    if (!url) {
      return;
    }
    return url.startsWith(AMP_CACHE_PREFIX);
  }

  _replaceUrl(url, ampUrlPrefix) {
    return join(ampUrlPrefix, url.substring(AMP_CACHE_PREFIX.length));
  }

  _addPreload(tree, parent, node, href, type) {
    const preload = tree.createElement('link', {
      rel: 'preload',
      href: href,
      as: type
    });
    parent.insertBefore(preload, node);
  }
}

module.exports = new RewriteAmpUrls();
