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
const sizeOf = require('image-size');
const jimp = require('jimp');

/**
 * Adds placeholders for all AMP images and posters that are blurry versions of
 * the corresponding original source. The blur will be displayed as the
 * <amp-img> is rendering, and will fade out once the element is loaded.
 */

class BlurImagePlaceholders {

  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    const body = html.firstChildByTag('body');
    let node = body;
    const ampImgPromises = [];
    while (node !== null) {
      if (node.tagName === 'amp-img' ||
      (node.tagName === 'amp-video' && node.attribs.poster)) {
        let parent = node;
        ampImgPromises.push(this.addBitmap_(tree, parent).then(imgChild => {
          parent.appendChild(imgChild);
          console.log(imgChild.attribs.src);
        }));
      }
      node = node.nextNode();
    }
    return Promise.all(ampImgPromises);
  }

  addBitmap_(tree, node) {
    const imgChild = tree.createElement('img');
    if (node.tagName === 'amp-img') {
      imgChild.attribs.src = node.attribs.src;
    } else {
      imgChild.attribs.src = node.attribs.poster;
    }
    imgChild.attribs.class = 'i-amphtml-blur';
    imgChild.attribs.placeholder = '';
    return this.getDataURI_(imgChild, tree).then(() => {
      return imgChild;
    });
  }

  getDataURI_(node, tree) {
    const bitMapDims = this.getBitmapDimensions_(node, tree);
    return this.createBitmap_(node, bitMapDims[0], bitMapDims[1]).then(dataURI => {
      node.attribs.src = dataURI;
    });
  }

  getBitmapDimensions_(node, tree) {
    const imgDims = sizeOf(node.attribs.src);
    const bitmapPixelAmt = 60;
    const tempImg = tree.createElement('IMG');
    tempImg.attribs.src = node.attribs.src;
    const imgWidth = imgDims.width;
    const imgHeight = imgDims.height;
    const ratioWidth = imgWidth / imgHeight;
    let bitmapHeight = bitmapPixelAmt / ratioWidth;
    bitmapHeight = Math.sqrt(bitmapHeight);
    const bitmapWidth = bitmapPixelAmt / bitmapHeight;
    return [Math.round(bitmapWidth), Math.round(bitmapHeight)];
  }

  createBitmap_(node, width, height) {
    return jimp.read(node.attribs.src)
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
