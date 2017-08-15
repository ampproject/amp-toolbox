'use strict';

class DomTransformer {

  constructor(treeParser, config) {
    this._treeParser = treeParser;
    this._config = config;
  }

  transform(html, params) {
    params = params || {};
    const tree = this._treeParser.parse(html);
    this._runTransformers(tree, params);
    return this._treeParser.serialize(tree);
  }

  _runTransformers(tree, params) {
    this._config.transformers.forEach(transformer => {
      transformer.transform(tree, params);
    });
  }
}

module.exports = DomTransformer;
