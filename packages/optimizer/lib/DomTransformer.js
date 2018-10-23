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

const path = require('path');
const treeParser = require('./TreeParser.js');

/**
 * Applies a set of transformations to a DOM tree.
 */
class DomTransformer {
  /**
   * Create a DomTransformer.
   * @param {Object} config - The config.
   * @param {Array.<Transformer>} config.transformers - a list of transformers to be applied.
   */
  constructor(config) {
    this.setConfig(config);
  }

  /**
   * Transforms an html string.
   * @param {string} html - a string containing valid HTML.
   * @param {Object} params - a dictionary containing transformer specific parameters.
   */
  transformHtml(html, params) {
    params = params || {};
    const tree = treeParser.parse(html);
    return this.transformTree(tree, params)
        .then(() => treeParser.serialize(tree));
  }

  /**
   * Transforms a DOM tree.
   * @param {Tree} tree - a DOM tree.
   * @param {Object} params - a dictionary containing transformer specific parameters.
   */
  transformTree(tree, params) {
    const sequence = (promise, transformer) => {
      return promise.then(() => {
        const result = Promise.resolve(transformer.transform(tree, params));
        return result;
      });
    };
    return this._transformers.reduce(sequence, Promise.resolve());
  }

  /**
   * Set the config.
   * @param {Object} config - The config.
   * @param {Array.<Transformer>} config.transformers - a list of transformers to be applied.
   */
  setConfig(config) {
    this._transformers = config.transformers.map((transformer) => {
      if (typeof transformer === 'string') {
        return require(path.join(__dirname, 'transformers', transformer + '.js'));
      }
      return transformer;
    });
  }
}

module.exports = DomTransformer;
