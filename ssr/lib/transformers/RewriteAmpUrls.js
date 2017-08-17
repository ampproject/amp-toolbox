'use strict';

const {join} = require('path');

const AMP_CACHE_PREFIX = 'https://cdn.ampproject.org';

/**
 * RewriteAmpUrls - rewrites all AMP runtime URLs to the origin
 * the AMP is being served from. This saves an additional HTTPS
 * request on initial page load. Use the `ampUrlPrefix` parameter
 * to configure a AMP runtime path prefix.
 */
class RewriteAmpUrls {
  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    if (!head) return;

    const ampUrlPrefix = params.ampUrlPrefix || '';

    for (let i = 0, len = head.children.length; i < len; i++) {
      const node = head.children[i];
      if (node.tagName === 'script' && this._usesAmpCacheUrl(node.attribs.src)) {
        node.attribs.src = this._replaceUrl(node.attribs.src, ampUrlPrefix);
      } else if (node.tagName === 'link' && this._usesAmpCacheUrl(node.attribs.href)) {
        node.attribs.href = this._replaceUrl(node.attribs.href, ampUrlPrefix);
      }
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
}

module.exports = new RewriteAmpUrls();
