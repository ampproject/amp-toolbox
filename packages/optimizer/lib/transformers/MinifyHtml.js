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

const Terser = require('terser');
const {remove} = require('../NodeUtils');

// Ignore comments of the form <!-- __AAAA_BBBB___ --> by default (used by Next.js)
const COMMENT_DEFAULT_IGNORE = [/^\s*__[a-bA-Z0-9_-]+__\s*$/];

// Matches all consecutive whitesapce
const WHITESPACE_REGEX = /\s+/g;

/**
 * NodeCleanUp - Minifies HTML by removing comments and unneeded whitespace
 *
 * This transformer will remove all
 *
 *
 * This transformer supports the following option:
 *
 * * `minifyHtml [Boolean]`: Disables HTML minification. The default is `true`.
 * * `removeWhitespace [Boolean]`: Removes unneeded whitespace. Ignores all whitespace inside <pre> and <textarea>. The default is `true`.
 * * `removeWhitespace [Boolean]`: Removes unneeded whitespace. The default is `true`.
 */
class MinifyHtml {
  constructor(config) {
    this.defaultOpts = {
      minifyHtml: !!config.minifyHtml || true,
      removeWhitespace: !!config.removeWhitespace || true,
      removeComments: !!config.removeComments || true,
      canCollapseWhitespace: true,
      canTrimWhitespace: true,
      commentIgnorePattern: config.commentIgnorePattern || COMMENT_DEFAULT_IGNORE,
    };
    this.log = config.log.tag('MinifyHtml');
  }
  transform(tree) {
    if (!this.defaultOpts.minifyHtml) {
      return;
    }
    const nodesToRemove = [];
    this.visitNode(tree, this.defaultOpts, nodesToRemove);
    for (const node of nodesToRemove) {
      remove(node);
    }
  }

  visitNode(node, opts, nodesToRemove) {
    if (node.type === 'text') {
      this.cleanTextNode(node, opts, nodesToRemove);
    } else if (node.type === 'comment') {
      this.cleanCommentNode(node, opts, nodesToRemove);
    } else if (node.tagName === 'script') {
      this.cleanScriptNode(node);
    }
    const childOpts = Object.assign({}, opts);
    if (opts.canCollapseWhitespace && !this.canCollapseWhitespace(node.tagName)) {
      childOpts.canCollapseWhitespace = false;
    }
    if (opts.canTrimWhitespace && !this.canTrimWhitespace(node.tagName)) {
      childOpts.canTrimWhitespace = false;
    }
    for (const child of node.children || []) {
      this.visitNode(child, childOpts, nodesToRemove);
    }
  }

  cleanTextNode(node, opts, nodesToRemove) {
    if (opts.canCollapseWhitespace && node.data) {
      node.data = node.data.replace(WHITESPACE_REGEX, ' ');
    }
    if (opts.canTrimWhitespace && node.data) {
      node.data = node.data.trim();
    }
    // remove empty nodes
    if (!node.data || node.data.length === 0) {
      nodesToRemove.push(node);
    }
  }

  cleanCommentNode(node, opts, nodesToRemove) {
    if (!node.data) {
      return;
    }
    for (const pattern of opts.commentIgnorePattern) {
      if (pattern.test(node.data)) {
        return;
      }
    }
    nodesToRemove.push(node);
  }

  cleanScriptNode(node) {
    const isJson = this.isJson(node);
    const isAmpScript = this.isInlineAmpScript(node);
    for (const child of node.children || []) {
      if (!child.data) {
        continue;
      }
      if (isJson) {
        try {
          child.data = JSON.stringify(JSON.parse(child.data), null, '');
        } catch (e) {
          // invalid JSON
          this.log.warn('Invalid JSON', child.data);
        }
      } else if (isAmpScript) {
        const result = Terser.minify(child.data);
        if (result.error) {
          this.log.warn(
              'Could not minify amp-script',
              child.data,
              `${result.error.name}: ${result.error.message}`,
          );
        } else {
          child.data = result.code;
        }
      }
    }
  }

  isInlineAmpScript(node) {
    return node.attribs &&
      node.attribs.type === 'text/plain' &&
      node.attribs.target === 'amp-script';
  }

  isJson(node) {
    return node.attribs && node.attribs.type === 'application/json';
  }

  canCollapseWhitespace(tagName) {
    return !/^(?:script|style|pre|textarea)$/.test(tagName);
  }

  canTrimWhitespace(tagName) {
    return !/^(?:pre|textarea)$/.test(tagName);
  }
}

module.exports = MinifyHtml;
