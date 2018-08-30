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

const FORMAT_RED = '\x1b[31m'; // Switches console color to red.
const FORMAT_GREEN = '\x1b[32m'; // Switches console color to green.
const FORMAT_YELLOW = '\x1b[33m'; // Switches console color to yello.
const FORMAT_RESET = '\x1b[0m'; // Resets the console color.
const FORMAT_HIGHLIGHT = '\x1b[1m'; // Highlights the console color.

const TAG_ERROR = `${FORMAT_RED}ERROR!${FORMAT_RESET}`;
const TAG_SUCCESS = `${FORMAT_GREEN}SUCCESS!${FORMAT_RESET}`;
const TAG_WARNING = `${FORMAT_YELLOW}WARNING!${FORMAT_RESET}`;

class Logger {
  error(args, tag = null) {
    console.error(this.formatTag_(tag), TAG_ERROR, args);
  }

  warn(args, tag = null) {
    console.log(this.formatTag_(tag), TAG_WARNING, args);
  }

  success(args, tag = null) {
    console.log(this.formatTag_(tag), TAG_SUCCESS, args);
  }

  log(args, tag = null) {
    console.log(this.formatTag_(tag), args);
  }

  formatTag_(tag) {
    if (!tag) {
      return '';
    }

    return `${FORMAT_HIGHLIGHT}[${tag}]:${FORMAT_RESET}`;
  }
}

module.exports = Logger;
