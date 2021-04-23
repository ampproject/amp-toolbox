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

const {
  DomTransformer,
  TRANSFORMATIONS_AMP_FIRST,
  TRANSFORMATIONS_PAIRED_AMP,
  CONFIG_BUILD,
  CONFIG_RUNTIME,
} = require('./lib/DomTransformer.js');

const NodeUtils = require('./lib/NodeUtils.js');

const DEFAULT_CONFIG = CONFIG_BUILD;

module.exports = {
  /*
   * @deprecated
   */
  create: (config = CONFIG_BUILD) => new DomTransformer(config),
  createFullOptimizer: (config = {}) => new DomTransformer(Object.assign({}, CONFIG_BUILD, config)),
  createFastOptimizer: (config = {}) =>
    new DomTransformer(Object.assign({}, CONFIG_RUNTIME, config)),
  TRANSFORMATIONS_AMP_FIRST,
  TRANSFORMATIONS_PAIRED_AMP,
  CONFIG_BUILD,
  CONFIG_RUNTIME,
  /*
   * @deprecated
   */
  DEFAULT_CONFIG,
  NodeUtils,
};
