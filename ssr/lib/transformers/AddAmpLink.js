'use strict';

/**
 * AddAmpLink - adds a reference to the valid AMP
 * version of this document.
 */
class AddAmpLink {
  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    if (!params.ampUrl) return; // no AMP URL configured

    const head = html.firstChildByTag('head');
    if (!head) return;

    const ampLink = tree.createElement('link', {
      rel: 'amphtml',
      href: params.ampUrl
    });

    head.appendChild(ampLink);
  }
}

module.exports = new AddAmpLink();
