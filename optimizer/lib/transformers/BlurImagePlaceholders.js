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
var sizeOf = require('image-size');
var jimp = require('jimp');

/**
 * Adds placeholders for all AMP images that are blurry versions of the
 * corresponding original source. The blur will be displayed as the <amp-img> is
 * loading, and
 */

class BlurImagePlaceholders {

  transform(tree, params) {
    const html = tree.root.firstChildByTag('html');
    const body = html.firstChildByTag('body');
    let node = body;
    var ampImgPromises = [];
    while (node !== null) {
      if (node.tagName === 'amp-img') {
        let parent = node;
        ampImgPromises.push(this.addBitmap(tree, parent).then
        (imgChild => {
            console.log("4");
            parent.appendChild(imgChild);
        }));
      }
        node = node.nextNode();
    }
    return Promise.all(ampImgPromises);
  }

  nextNode(node) {
    if (node.nextSibling) {
      return node.nextSibling;
    }
    return this.nextNode(node.parent);
  }

  addBitmap(tree, node) {
      const imgChild = tree.createElement('img');
      imgChild.attribs.src = node.attribs.src;
      imgChild.attribs.class = 'i-amphtml-blur';
      imgChild.attribs.placeholder = '';
      return this.getDataURI(imgChild, tree).then
      (() => {
        return imgChild;
      });
  }

  getDataURI(node, tree){
    const bitMapDims = this.getBitmapDimensions(node, tree);
    return this.createBitmap(node, bitMapDims[0], bitMapDims[1]).then
    (dataURI => {
      console.log("2");
      node.attribs.src = dataURI;
    });
  }

  getBitmapDimensions(node, tree){
   const imgDims = sizeOf(node.attribs.src);
   const bitmapPixelAmt = 60;
   const tempImg = tree.createElement('IMG');
   tempImg.attribs.src = node.attribs.src;
   const imgWidth = imgDims.width;
   const imgHeight = imgDims.height;
   const ratioWidth = imgWidth/imgHeight;
   let bitmapHeight = bitmapPixelAmt/ratioWidth;
   bitmapHeight = Math.sqrt(bitmapHeight);
   const bitmapWidth = bitmapPixelAmt/bitmapHeight;
   return [Math.round(bitmapWidth), Math.round(bitmapHeight)];
  }

  createBitmap(node, width, height){
    return jimp.read(node.attribs.src)
    .then(image => {
      image.resize(width, height, jimp.RESIZE_BEZIER);
      //image.quality(50);
      console.log("1");
      return image.getBase64Async('image/png');
      //console.log("gggg " + node.attribs.src);
      
    })
    .catch(err => {
        console.log(err);
    });
  }
}

/** @module BlurImagePlaceholders */
module.exports = new BlurImagePlaceholders();
