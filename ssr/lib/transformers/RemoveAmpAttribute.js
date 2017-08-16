'use strict';

const {AMP_TAGS} = require('../AmpConstants.js');

class RemoveAmpAttribute {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    for (let i = 0, len = AMP_TAGS.length; i < len; i++) {
      delete html.attribs[AMP_TAGS[i]];
    }
  }
}

module.exports = new RemoveAmpAttribute();
