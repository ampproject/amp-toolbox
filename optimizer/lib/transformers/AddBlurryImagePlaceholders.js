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
const sizeOf = require('image-size');
const jimp = require('jimp');
const PIXEL_TARGET = 60;
const MAX_BLURRED_PLACEHOLDERS = 5;

const {nextNode} = require('../HtmlDomHelper');

/**
 * Adds placeholders for certain amp-img's and posters for amp-videos that are
 * blurry versions of the corresponding original source. The blur will be
 * displayed as the <amp-img> is rendering, and will fade out once the element
 * is loaded. The current requirements of appending a blurry placeholder is for
 * the element is to be a JPEG that is either responsive or a poster for an
 * amp-video.
 */
class AddBlurryImagePlaceholders {
  /**
   * Parses the document to add blurred placedholders in all appropriate
   * locations.
   * @param {TreeAdapter} tree A parse5 treeAdapter.
   * @return {Array} An array of promises that all represents the resolution of
   * a blurred placeholder being added in an appropriate place.
   */
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const body = html.firstChildByTag('body');
    const promises = [];
    let currPlaceholderCount = 0;
    for (let node = body; node !== null; node = node.nextNode()) {
      const {tagName} = node;
      let src;
      if (tagName === 'template') {
        node = nextNode(node);
        continue;
      }
      if (tagName === 'amp-img') {
        src = node.attribs.src;
      }
      if (tagName === 'amp-video' && node.attribs.poster) {
        src = node.attribs.poster;
      }
      if (currPlaceholderCount >= MAX_BLURRED_PLACEHOLDERS) {
        break;
      }
      if (this.shouldAddBlurryPlaceholder_(node, src, tagName)) {
        promises.push(this.addBlurryPlaceholder_(tree, src)
          .then((imgChild) => {
            if (currPlaceholderCount >= MAX_BLURRED_PLACEHOLDERS) {
              return;
            }
            node.appendChild(imgChild);
            currPlaceholderCount++;
          })
        );
      }
    }
    return Promise.all(promises);
  }


  /**
   * Adds a child image that is a blurry placeholder.
   * @param {TreeAdapter} tree A parse5 treeAdapter.
   * @param {String} src The image that the bitmap is based on.
   * @return {!Promise} A promise that signifies that the img has been updated
   * to have correct attributes to be a blurred placeholder.
   * @private
   */
  addBlurryPlaceholder_(tree, src) {
    const img = tree.createElement('img');
    img.attribs.src = src;
    img.attribs.class = 'i-amphtml-blur';
    img.attribs.placeholder = '';
    return this.getDataURI_(img).then(() => {
      return img;
    }).catch((err) => {
      console.error('AddBlurryImagePlaceholders transformer error during the ' +
       'calculation of bitmap size from the source image: ' + err);
    });
  }

  /**
   * Creates the bitmap in a dataURI format.
   * @param {Node} img The DOM element that needs a dataURI for the
   * placeholder.
   * @return {!Promise} A promise that is resolved once the img's src is updated
   * to be a dataURI of a bitmap.
   * @private
   */
  getDataURI_(img) {
    const bitMapDims = this.getBitmapDimensions_(img);
    return this.createBitmap_(img, bitMapDims.width, bitMapDims.height)
      .then((dataURI) => {
        img.attribs.src = dataURI;
      });
  }

  /**
   * Calculates the correct dimensions for the bitmap.
   * @param {Node} img The DOM element that will need a bitmap.
   * placeholder.
   * @return {Record} The aspect ratio of the bitmap of the image.
   * @private
   */
  getBitmapDimensions_(img) {
    // Gets the original aspect ratio of the image.
    const imgDims = sizeOf(img.attribs.src);
    const imgWidth = imgDims.width;
    const imgHeight = imgDims.height;
    // Aims for a bitmap of ~P pixels (w * h = ~P).
    // Gets the ratio of the width to the height. (r = w0 / h0 = w / h)
    const ratioWH = imgWidth / imgHeight;
    // Express the width in terms of height by multiply the ratio by the
    // height. (h * r = (w / h) * h)
    // Plug this representation of the width into the original equation.
    // (h * r * h = ~P).
    // Divide the bitmap size by the ratio to get the all expressions using
    // height on one side. (h * h = ~P / r)
    let bitmapHeight = PIXEL_TARGET / ratioWH;
    // Take the square root of the height instances to find the singular value
    // for the height. (h = sqrt(~P / r))
    bitmapHeight = Math.sqrt(bitmapHeight);
    // Divide the goal total pixel amount by the height to get the width.
    // (w = ~P / h).
    const bitmapWidth = PIXEL_TARGET / bitmapHeight;
    return {width: Math.round(bitmapWidth), height: Math.round(bitmapHeight)};
  }

  /**
   * Reads and transforms an image to a blurry placeholder format.
   * @param {Node} img The DOM element that will need a bitmap.
   * placeholder.
   * @return {!Promise} A promise that is resolved when the image has been read
   * and transformed.
   * @private
   */
  createBitmap_(img, width, height) {
    return jimp.read(img.attribs.src)
      .then((image) => {
        image.resize(width, height, jimp.RESIZE_BEZIER);
        return image.getBase64Async('image/png');
      })
      .catch((err) => {
        console.error('Jimp error during the creation of the bitmap/the' +
          'encoding of the data URI: ' + err);
      });
  }

  /**
   * Checks if an element has a placeholder.
   * @param {Node} node The DOM element that is being checked for a placeholder.
   * @return {boolean} Whether or not the element already has a placeholder
   * child.
   * @private
   */
  hasPlaceholder_(node) {
    node.childNodes.forEach((child) => {
      if (child.attribs && child.attribs.placeholder) {
        return true;
      }
    });
    return false;
  }

  /**
   * Checks if an image should have a blurred image placeholder.
   * The current criteria for determining if a blurry image placeholder should
   * be appended is as follows:
   * - The source for the image should be a JPEG.
   * - If the element is an amp-img that is responsive and does not have a no
   * loading attribute OR the element is a poster on an amp-video
   *
   * This criteria was found to be the most common places where a blurry image
   * placeholder would likely want to be used through manual examination of
   * existing AMP pages.
   * @param {Node} node The DOM element that is being checked to see if it
   * should have a blurred placeholder.
   * @param {string} src The image source that is being checked.
   * @param {string} tagName The type of element that is being checked.
   * @return {boolean} Whether or not the element should have a blurred
   * placeholder child.
   * @private
   */
  shouldAddBlurryPlaceholder_(node, src, tagName) {
    // Checks to see if the image doesn't have a source or if it already has a
    // placeholder.
    if (!src || this.hasPlaceholder_(node)) {
      return false;
    }

    // Checks to see if the image is a jpeg.
    if (!src.endsWith('.jpg') && !src.endsWith('jpeg')) {
      return false;
    }

    // Checks if the image is a poster or a responsive image without a no
    // loading attribute.
    const isPoster = tagName == 'amp-video';
    const isResponsiveImgWithLoading = (tagName == 'amp-img' &&
      node.attribs.layout == 'responsive' && (node.attribs.noloading == null));
    return isPoster || isResponsiveImgWithLoading;
  }
}

/** @module AddBlurryImagePlaceholders */
module.exports = new AddBlurryImagePlaceholders();
