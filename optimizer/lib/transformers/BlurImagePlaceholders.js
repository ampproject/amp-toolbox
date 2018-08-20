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

/**
 * Adds placeholders for all AMP images and posters that are blurry versions of
 * the corresponding original source. The blur will be displayed as the
 * <amp-img> is rendering, and will fade out once the element is loaded.
 */
class BlurImagePlaceholders {
  /**
   * Parses the document to add blurred placedholders in all appropriate
   * locations.
   * @param tree A parse5 treeAdapter.
   * @return {Array} An array of promises that all represents the resolution of
   * a blurred placeholder being added in an appropriate place.
   */
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const body = html.firstChildByTag('body');
    const promises = [];
    for (let node = body; node !== null; node = node.nextNode()) {
      const {tagName} = node;
      let src;
      if (tagName === 'amp-img') {
        src = node.attribs.src;
      }
      if (tagName === 'amp-video' && node.attribs.poster) {
        src = node.attribs.poster;
      }
      if (src && !this.hasPlaceholder_(node)) {
        promises.push(this.addBlurryPlaceholder_(tree, src).then(imgChild => {
          node.appendChild(imgChild);
        }));
      }
    }
    return Promise.all(promises);
  }

  /**
   * Adds a child image that is a blurry placeholder.
   * @param tree A parse5 treeAdapter.
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
    }).catch(err => {
      console.log(err);
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
    return this.createBitmap_(img, bitMapDims.width, bitMapDims.height).then(dataURI => {
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
    // Aims for a bitmap of ~60 pixels (w * h = ~60).
    const bitmapPixelAmt = 60;
    // Gets the ratio of the width to the height. (r = w0 / h0 = w / h)
    const ratioWH = imgWidth / imgHeight;
    // Express the width in terms of height by multiply the ratio by the
    // height. (h * r = (w / h) * h)
    // Plug this representation of the width into the original equation.
    // (h * r * h = ~60).
    // Divide the bitmap size by the ratio to get the all expressions using
    // height on one side. (h * h = ~60 / r)
    let bitmapHeight = bitmapPixelAmt / ratioWH;
    // Take the square root of the height instances to find the singular value
    // for the height. (h = sqrt(~60 / r))
    bitmapHeight = Math.sqrt(bitmapHeight);
    // Divide the goal total pixel amount by the height to get the width.
    // (w = ~60 / h).
    const bitmapWidth = bitmapPixelAmt / bitmapHeight;
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
      .then(image => {
        image.resize(width, height, jimp.RESIZE_BEZIER);
        return image.getBase64Async('image/png');
      })
      .catch(err => {
        console.log(err);
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
    node.childNodes.forEach(child => {
      if (child.attribs.placeholder) {
        return true;
      }
    });
    return false;
  }
}

/** @module BlurImagePlaceholders */
module.exports = new BlurImagePlaceholders();
