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
 * Adds preload instructions to the first 5 amp-img tags on the page, that don't use srcset.
 *
 * AMP requires the usage of `amp-img` for images, instead of the regular `img` tag. Since
 * `amp-img` tags are custom elements, the AMP Runtime needs to be loaded before the images
 * are to the server.
 *
 * By issue preload instructions, browsers will start downloading the images, resulting on
 * the images showing earlier on the page.
 */
class PreloadImagesTransformer {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    const body = html.firstChildByTag('body');
    let ampImgCount = 0;

    for (let node = body; node !== null; node = node.nextNode()) {
      switch (node.tagName) {
        case 'amp-img': {
          // If srcset is used, skip preloading as we don't know which image will be used.
          if (node.attribs.srcset) {
            return;
          }

          if (ampImgCount < 5) {
            const src = node.attribs.src;
            const link = tree.createElement('link');
            link.attribs.rel = 'preload';
            link.attribs.href = src;
            link.attribs.as = 'image';
            head.appendChild(link);
            ampImgCount++;
          }
          break;
        }

        default:
          break;
      }
    }
  }
}

/** @module PreloadImagesTransformer */
module.exports = PreloadImagesTransformer;
