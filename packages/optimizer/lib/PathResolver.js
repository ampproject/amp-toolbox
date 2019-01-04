/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
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


const {join, resolve} = require('path');

const DUMMY_HOST = 'https://example.com';

/**
 * Resolves a given URL / path against an optional base. The base can either specify an URL or
 * a relative filesystem path.
 */
class PathResolver {
  /**
   * Create a PathResolver.
   * @param {string}  [base=''] - relative path or base URL
   */
  constructor(base) {
    this.base_ = base || '';
    try {
      new URL(base);
      this.baseSpecifiesHost_ = true;
    } catch (_) {
      // base is not a valid host
      this.baseSpecifiesHost_ = false;
    }
  }

  /**
   * Resolves the given path against the base.
   *
   * @param {string} path - an absolute or relative URL
   * @returns {string}
   */
  resolve(path) {
    try {
      if (this.baseSpecifiesHost_) {
        return new URL(path, this.base_).toString();
      } else {
        return new URL(path).toString();
      }
    } catch (_) {
      // path and base specify a relative path
    }
    // remove query params to be able to find a file on the local filesystem
    path = new URL(path, DUMMY_HOST).pathname.substring(1);
    // resolve path to make debugging easier in case a file cannot be found locally
    return resolve(join(this.base_, path));
  }
}

module.exports = PathResolver;
