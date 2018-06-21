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

const {findMetaViewport} = require('../HtmlDomHelper');

/**
 * Adds preload instructions to the first 5 amp-img tags on the page, that don't use srcset.
 *
 * AMP requires the usage of `amp-img` for images instead of the regular `img` tag. Since
 * `amp-img` tags are custom elements, the AMP Runtime needs to be loaded before the images
 * are requested from the server.
 *
 * By issuing preload instructions, browsers will start downloading the images before the AMP
 * runtime is loaded, resulting on an earlier complete render.
 */

// Maximum number of images that will be preloaded.
const MAX_PRELOADED_IMAGES = 5;

class PreloadImages {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    const body = html.firstChildByTag('body');
    const preloadImageMap = new Map();

    for (let node = body; node !== null; node = node.nextNode()) {
      // We've hit the maximum number of preloads.
      if (preloadImageMap.size >= MAX_PRELOADED_IMAGES) {
        break;
      }
      let imageUrl = this.extractImageUrl(node);

      if (!imageUrl) {
        continue;
      }

      // If srcset is used, skip preloading as we don't know which image will be used.
      if (node.attribs.srcset) {
        continue;
      }

      preloadImageMap.set(imageUrl, this.createPreload(tree, imageUrl, node.attribs.media));
    }

    let referenceNode = findMetaViewport(head);

    for (let preload of preloadImageMap.values()) {
      head.insertAfter(preload, referenceNode);
      referenceNode = preload;
    }
  }

  extractImageUrl(node) {
    if (node.tagName === 'amp-img') {
      return node.attribs.src;
    }
    if (node.tagName === 'amp-video') {
      return node.attribs.poster;
    }
    return null;
  }

  createPreload(tree, href, media) {
    const preload = tree.createElement('link');
    preload.attribs.rel = 'preload';
    preload.attribs.href = href;
    preload.attribs.as = 'image';
    if (media) {
      preload.attribs.media = media;
    }
    return preload;
  }
}

/** @module PreloadImages */
module.exports = new PreloadImages();
