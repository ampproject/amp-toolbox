'use strict';

class ServerSideRendering {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    html.attribs['i-amphtml-layout'] = '';
  }
}

module.exports = new ServerSideRendering();
