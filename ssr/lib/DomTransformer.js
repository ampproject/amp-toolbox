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

const treeParser = require('./TreeParser.js');

class DomTransformer {

  constructor(treeParser, config) {
    this._treeParser = treeParser;
    this.setConfig(config);
  }

  transformHtml(html, params) {
    params = params || {};
    const tree = this._treeParser.parse(html);
    this.transformTree(tree, params);
    return this._treeParser.serialize(tree);
  }

  transformTree(tree, params) {
    this._transformers.forEach(transformer => {
      transformer.transform(tree, params);
    });
  }

  setConfig(config) {
    this._transformers = config.transformers.map(transformer => {
      if (typeof transformer === 'string') {
        return require('./transformers/' + transformer + '.js');
      } else {
        return transformer;
      }
    });
  }
}

module.exports = {
  create: config => new DomTransformer(treeParser, config)
};
