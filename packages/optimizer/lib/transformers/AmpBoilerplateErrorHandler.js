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
  appendChild,
  createElement,
  hasAttribute,
  firstChildByTag,
  insertText,
} = require('../NodeUtils');

/**
 * Error handler script to be added to the document's <head> for AMP pages not using ES modules.
 */
const ERROR_HANDLER_NOMODULE =
  'document.querySelector("script[src*=\'/v0.js\']").onerror=function(){' +
  "document.querySelector('style[amp-boilerplate]').textContent=''}";

/**
 * Error handler script to be added to the document's <head> for AMP pages using ES modules.
 */
const ERROR_HANDLER_MODULE =
  '[].slice.call(document.querySelectorAll(' +
  "\"script[src*='/v0.js'],script[src*='/v0.mjs']\")).forEach(" +
  'function(s){s.onerror=' +
  'function(){' +
  "document.querySelector('style[amp-boilerplate]').textContent=''" +
  '}})';

/**
 * AmpBoilerplateErrorHandler - adds amp-onerror handler to disable boilerplate early on runtime error
 *
 * This ensures that the boilerplate does not hide the content for several seconds if an error occurred
 * while loading the AMP runtime that could already be detected much earlier.
 */
class AmpBoilerplateErrorHandler {
  transform(root, params) {
    const html = firstChildByTag(root, 'html');
    if (!html) {
      return;
    }

    if (hasAttribute(html, 'i-amphtml-no-boilerplate')) {
      // Boilerplate was removed, so no need for the amp-onerror handler
      return;
    }

    const head = firstChildByTag(html, 'head');
    if (!head) {
      return;
    }

    const errorHandler = createElement('script', {'amp-onerror': ''});
    if (params.esmModulesEnabled) {
      insertText(errorHandler, ERROR_HANDLER_MODULE);
    } else {
      insertText(errorHandler, ERROR_HANDLER_NOMODULE);
    }

    appendChild(head, errorHandler);
  }
}

module.exports = AmpBoilerplateErrorHandler;
