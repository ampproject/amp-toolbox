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
 * Adds a preconnect instruction to `fonts.gstatic.com` when the Google Fonts CSS
 * is used in the page.
 *
 * The Google Fonts CSS requests fonts `https://fonts.gstatic.com` after it is loaded.
 * Browsers only connect to this domain after the CSS has been downloaded and the CSSOM has been
 * constructed.
 *
 * By preconnecting earlier, the DNS resolution, TCP connection and SSL handshake are performed
 * sooner, saving up to 1 second on regular 3G networks, resulting on the Fonts being loaded
 * earlier.
 *
 * The transformer will only issue the preconnect instruction if Google Fonts is used on the page.
 */
class GoogleFontsPreconnect {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    const referenceNode = this.getReferenceNode_(head);

    for (let node = head.firstChild; node !== null; node = node.nextSibling) {
      if (this.isGoogleFontsLinkNode_(node)) {
        // Preconnect to fonts.gstatic.com, where the final fonts are downloaded.
        const linkPreconnect = tree.createElement('link');
        linkPreconnect.attribs.rel = 'preconnect';
        linkPreconnect.attribs.href = 'https://fonts.gstatic.com';
        linkPreconnect.attribs.crossorigin = '';
        head.insertBefore(linkPreconnect, referenceNode);
      }
    }
  }

  getReferenceNode_(head) {
    const referenceNode = head.firstChildByTag('meta');

    // Check if firstChild is meta charset and return nextSibling so that the preconnect is
    // inserted after the meta charset tag.
    if (referenceNode && referenceNode.tagName === 'meta' && referenceNode.attribs.charset) {
      return referenceNode.nextSibling;
    }

    // Otherwise, the preconnect will be inserted before the 1st element in the head.
    return head.firstChild;
  }

  isGoogleFontsLinkNode_(node) {
    return node.tagName === 'link' &&
      node.attribs.rel === 'stylesheet' &&
      node.attribs.href.startsWith('https://fonts.googleapis.com');
  }
}

/** @module GoogleFontsPreconnect */
module.exports = new GoogleFontsPreconnect();
