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
   * @param {Tree} tree - a DOM tree.
   * @param {Object} params - a dictionary containing transformer specific parameters.
   */
  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    const body = html.firstChildByTag('body');
    const promises = [];
    for (let node = body; node !== null; node = node.nextNode()) {
      let childSrc;
      if (node.tagName === 'amp-img') {
        childSrc = node.attribs.src;
      }
      if (node.tagName === 'amp-video' && node.attribs.poster) {
        childSrc = node.attribs.poster;
      }
      if (childSrc) {
        let parent = node;
        promises.push(this.addBitmap_(tree, childSrc).then(imgChild => {
          parent.appendChild(imgChild);
        }));
      }
    }
    return Promise.all(promises);
  }

  /**
   * Adds a child image
   * @param {Tree} tree - a DOM tree
   * @param {String} parentURL - The image that the bitmap is based on.
   */
  addBitmap_(tree, parentImg) {
    const imgChild = tree.createElement('img');
    imgChild.attribs.src = parentImg;
    imgChild.attribs.class = 'i-amphtml-blur';
    imgChild.attribs.placeholder = '';
    return this.getDataURI_(imgChild).then(() => {
      return imgChild;
    })
    .catch(err => {
      console.log(err);
    });
  }

  /**
   * Creates the bitmap in a dataURI format.
   * @param {Node} img - The DOM element that needs a dataURI for the
   * placeholder.
   */
  getDataURI_(img) {
    const bitMapDims = this.getBitmapDimensions_(img);
    return this.createBitmap_(img, bitMapDims[0], bitMapDims[1]).then(dataURI => {
      img.attribs.src = dataURI;
    });
  }

  /**
   * Calculates the correct dimensions for the bitmap.
   * @param {Node} img - The DOM element that will need a bitmap.
   * placeholder.
   */
  getBitmapDimensions_(img) {
    const imgDims = sizeOf(img.attribs.src);
    const bitmapPixelAmt = 60;
    const imgWidth = imgDims.width;
    const imgHeight = imgDims.height;
    const ratioWidth = imgWidth / imgHeight;
    let bitmapHeight = bitmapPixelAmt / ratioWidth;
    bitmapHeight = Math.sqrt(bitmapHeight);
    const bitmapWidth = bitmapPixelAmt / bitmapHeight;
    return [Math.round(bitmapWidth), Math.round(bitmapHeight)];
  }

  /**
   * Calculates the correct dimensions for the bitmap.
   * @param {Node} img - The DOM element that will need a bitmap.
   * placeholder.
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
}

/** @module BlurImagePlaceholders */
module.exports = new BlurImagePlaceholders();
