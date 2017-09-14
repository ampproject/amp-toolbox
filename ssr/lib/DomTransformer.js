'use strict';

const treeParser = require('./TreeParser.js');

class DomTransformer {

  constructor(treeParser, config) {
    this._treeParser = treeParser;
    this._config = config;
  }

  transformHtml(html, params) {
    params = params || {};
    const tree = this._treeParser.parse(html);
    this.transformTree(tree, params);
    return this._treeParser.serialize(tree);
  }

  transformTree(tree, params) {
    this._config.transformers.forEach(transformer => {
      transformer.transform(tree, params);
    });
  }
}

module.exports = {
  create: config => new DomTransformer(treeParser, config)
};
