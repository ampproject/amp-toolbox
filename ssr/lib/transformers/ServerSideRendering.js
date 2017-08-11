'use strict';

class ServerSideRendering {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    html.attribs['i-amphtml-no-boilerplate'] = '';
    delete html.attribs.amp;
  }
}

module.exports = ServerSideRendering;
