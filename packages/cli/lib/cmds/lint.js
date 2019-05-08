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

const {cli} = require('amp-toolbox-linter');

function lint(args, logger) {
  const url = args._[1];
  if (!url) {
    return Promise.reject(new Error('Missing URL'));
  }
  return cli(['dummy'].concat(args._), logger); // "dummy" to simulate process.argv
}

module.exports = lint;
