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
  TRANSFORMATIONS_MINIMAL,
  DEFAULT_CONFIG,
} = require('./lib/DomTransformer.js');
const NodeUtils = require('./lib/NodeUtils.js');

module.exports = {
  create: (config = DEFAULT_CONFIG) => new DomTransformer(config),
  TRANSFORMATIONS_AMP_FIRST,
  /* @private */ TRANSFORMATIONS_MINIMAL,
  TRANSFORMATIONS_PAIRED_AMP,
  DEFAULT_CONFIG,
  NodeUtils,
};
