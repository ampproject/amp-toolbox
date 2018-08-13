'use strict';
var sizeOf = require('image-size');
var jimp = require('jimp');
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
      return image.getBase64Async('image/png');      
    })
    .catch(err => {
        console.log(err);
    });
  }
}

/** @module BlurImagePlaceholders */
module.exports = new BlurImagePlaceholders();
