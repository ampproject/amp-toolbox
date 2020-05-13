/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const {hasAttribute, nextNode, firstChildByTag} = require('../NodeUtils');
const {skipNodeAndChildren} = require('../HtmlDomHelper');
const {isValidImageSrcURL} = require('../URLUtils');

const MAX_IMG_SIZE = 820;
const MIN_WIDTH_TO_ADD_SRCSET_IN_RESPONSIVE_LAYOUT = 300;
const NUM_SRCSET_DPR = [1.0, 2.0, 3.0];
const SRCSET_WIDTH = [
  39,
  47,
  56,
  68,
  82,
  100,
  120,
  150,
  180,
  220,
  270,
  330,
  390,
  470,
  560,
  680,
  820,
  1000,
  1200,
];

/**
 * Default implementation that does not perform any kind of image optimization, but generates a `srcset` string
 * by appending the width to the file name (e.g. image.jpg => image.32w.jpg).
 *
 * @param {string} src - the image src
 * @param {number} width - the required widths (in px)
 * @returns {string|undefined} - the image URL or undefined if no image is available in this dimension

 */
const DEFAULT_IMAGE_OPTIMIZER = (src, width) => {
  // we cannot rename if the image does not have a file extension
  const index = src.lastIndexOf('.');
  if (index === -1) {
    return null;
  }
  const prefix = src.substring(0, index);
  const postfix = src.substring(index, src.length);
  return `${prefix}.${width}w${postfix}`;
};

/**
 *
 */
class SrcsetWidth {
  constructor() {
    this.widthList_ = [];
  }

  /**
   * Sets the base width, i.e., renderered dimension measured in CSS pixels.
   * Returns true if srcset is needed, that is, we'll resize the image to at
   * least 2 legitimate widths.
   * if max_img_width is provided the actual image size in srcset will not
   * exceed this value. So if max_img_width is 820, the srcset will not
   * contain any image greater than 820px. The max_img_width is not absolute
   * number but depends on the aspect ratio. So if 650 is max_img_width, the
   * nearest aspect ratio width for this max width is 620.
   *
   * @param {Number} imgSrcWidth
   * @param {Number} maxImgWidth
   */
  setBaseWidth(imgSrcWidth, maxImgWidth = -1) {
    this.widthList_.length = 0;
    let previousWidth = -1;
    if (maxImgWidth > 0 && imgSrcWidth > maxImgWidth) {
      return;
    }

    for (let i = NUM_SRCSET_DPR.length - 1; i >= 0; --i) {
      let width = this.roundUp(Math.ceil(imgSrcWidth * NUM_SRCSET_DPR[i]));
      if (maxImgWidth > 0 && width > maxImgWidth) {
        width = maxImgWidth;
      }
      if (width != previousWidth) {
        this.widthList_.push(width);
      }

      previousWidth = width;
    }
  }

  /**
   *  Returns true if there is more legitimate width.
   */
  moreWidth() {
    return this.widthList_.length > 0;
  }

  /**
   * Returns the current legitimate width and moves the state to the next one.
   */
  nextWidth() {
    const nextWidth = this.widthList_[this.widthList_.length - 1];
    this.widthList_.pop();
    return nextWidth;
  }

  /**
   *
   */
  isValid() {
    return this.widthList_.length > 1;
  }

  roundUp(value) {
    for (const width of SRCSET_WIDTH) {
      if (width > value) {
        return width;
      }
    }
    return SRCSET_WIDTH[SRCSET_WIDTH.length - 1];
  }
}

/**
 * ImageTransformer - generates srcset attribute for amp-img.
 *
 * This transformer supports the following option:
 *
 * - `optimizeImages`: set to `true` to enable image optimization, by default it will encode addition widt
 * - `imageOptimizer`: a function for customizing the srcset generation. The function should return a URL
 *    pointing to a version of the `src` image with the given `width`. If no image is available, it should
 *    return a falsy value. For example:
 *
 *       (src, width) => `${src}?width=${width}`
 */
class OptimizeImages {
  constructor(config) {
    this.log = config.log;
    this.enabled = !!config.optimizeImages;
    this.imageOptimizer = config.imageOptimizer || DEFAULT_IMAGE_OPTIMIZER;
    this.srcsetWidth = new SrcsetWidth();
  }

  async transform(root) {
    if (!this.enabled) {
      return;
    }
    const html = firstChildByTag(root, 'html');
    const body = firstChildByTag(html, 'body');

    let node = body;
    while (node !== null) {
      if (node.tagName === 'template') {
        node = skipNodeAndChildren(node);
      } else {
        if (node.tagName === 'amp-img') {
          await this.optimizeImage(node);
        }
        node = nextNode(node);
      }
    }
  }

  async optimizeImage(imageNode) {
    // Don't change existing srcsets.
    if (hasAttribute(imageNode, 'srcset')) {
      return;
    }
    // Should not happen for valid AMP.
    if (!hasAttribute(imageNode, 'src')) {
      return;
    }
    const src = imageNode.attribs.src;
    // Check if it's a relative path or a valid http(s) URL.
    if (!isValidImageSrcURL(src)) {
      return;
    }

    // No srcset is added if the image ends with a `,` (comma). See
    // http://b/127535381 for context.
    if (src.endsWith(',')) {
      return;
    }
    const width = imageNode.attribs.width;

    // TODO(b/113271759): Handle width values that include 'px' (probably others).
    if (Number.parseInt(width) === NaN) {
      // No width or invalid width.
      return;
    }

    // Determine if the layout is "responsive".
    const {layout, height, sizes} = imageNode.attribs;
    const isResponsive = layout === 'responsive' || (!layout && height && sizes);

    // In responsive layout, width and height might be used for indicating
    // the aspect ratio instead of the actual render dimensions. This usually
    // happens for dimensions of small values.
    if (isResponsive && width < MIN_WIDTH_TO_ADD_SRCSET_IN_RESPONSIVE_LAYOUT) {
      return;
    }

    // We add srcset only when the CSS dimensions correspond to 2 or more
    // unique legitimate physical dimensions.
    this.srcsetWidth.setBaseWidth(width, MAX_IMG_SIZE);
    if (!this.srcsetWidth.isValid()) {
      return;
    }
    // Generate the srcset.
    let srcset = '';
    while (this.srcsetWidth.moreWidth()) {
      const nextWidth = this.srcsetWidth.nextWidth();
      try {
        // Generate the width specific image URL using the default or custom srcset generator.
        const nextSrc = await this.imageOptimizer(src, nextWidth);
        // Add the width (if supported) to the srcset.
        if (nextSrc) {
          srcset += `${nextSrc} ${nextWidth}w${this.srcsetWidth.moreWidth() ? ', ' : ''}`;
        }
      } catch (e) {
        this.log.error('Exception when optimizing image', src, e);
      }
    }
    if (srcset) {
      imageNode.attribs.srcset = srcset;
      this.log.debug('Generating img srcset', src, imageNode.attribs.srcset);
    }
  }
}

module.exports = OptimizeImages;
