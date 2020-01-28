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
const normalizeWhitespace = require('normalize-html-whitespace');

// Ignore comments of the form <!-- __AAAA_BBBB___ --> by default (used by Next.js)
const COMMENT_DEFAULT_IGNORE = /^\s*__[a-bA-Z0-9_-]+__\s*$/;

/**
 * MinifyHtml - minifies files size by:
 *
 * - minifying inline JSON
 * - minifying inline amp-script using https://www.npmjs.com/package/terser
 * - collapsing whitespace outside of pre, script, style and area.
 * - removing comments
 *
 * This transformer supports the following options:
 *
 * - `minify [Boolean]`: Enables HTML minification. The default is `true`.
 */
class MinifyHtml {
  constructor(config) {
    this.opts = {
      minify: !!config.minify || true,
      minifyAmpScript: true,
      minifyJSON: true,
      collapseWhitespace: true,
      removeComments: true,
      canCollapseWhitespace: true,
      inBody: true,
      commentIgnorePattern: COMMENT_DEFAULT_IGNORE,
    };
    this.log = config.log.tag('MinifyHtml');
  }
  transform(tree) {
    if (!this.opts.minify) {
      return;
    }
    // store nodes for later deletion to avoid changing the tree structure
    // while iterating the DOM
    const nodesToRemove = [];
    // recursively walk through all nodes and minify if possible
    this.minifyNode(tree, this.opts, nodesToRemove);
    for (const node of nodesToRemove) {
      remove(node);
    }
  }

  minifyNode(node, opts, nodesToRemove) {
    if (node.type === 'text') {
      this.minifyTextNode(node, opts, nodesToRemove);
    } else if (node.type === 'comment') {
      this.minifyCommentNode(node, opts, nodesToRemove);
    } else if (node.tagName === 'script') {
      this.minifyScriptNode(node, opts);
    }
    // update options based on the current node
    const childOpts = Object.assign({}, opts);
    if (opts.canCollapseWhitespace && !this.canCollapseWhitespace(node.tagName)) {
      childOpts.canCollapseWhitespace = false;
    }
    if (node.tagName === 'head' || node.tagName === 'html') {
      childOpts.inBody = false;
    }
    if (node.tagName === 'body') {
      childOpts.inBody = true;
    }
    // minify all child nodes
    for (const child of node.children || []) {
      this.minifyNode(child, childOpts, nodesToRemove);
    }
  }

  minifyTextNode(node, opts, nodesToRemove) {
    if (!node.data || !opts.collapseWhitespace) {
      return;
    }
    if (opts.canCollapseWhitespace) {
      node.data = normalizeWhitespace(node.data);
    }
    if (!opts.inBody) {
      node.data = node.data.trim();
    }
    // remove empty nodes
    if (node.data.length === 0) {
      nodesToRemove.push(node);
    }
  }

  minifyCommentNode(node, opts, nodesToRemove) {
    if (!node.data || !opts.removeComments) {
      return;
    }
    if (opts.commentIgnorePattern.test(node.data)) {
      return;
    }
    nodesToRemove.push(node);
  }

  minifyScriptNode(node, opts) {
    const isJson = this.isJson(node);
    const isAmpScript = this.isInlineAmpScript(node);
    for (const child of node.children || []) {
      if (!child.data) {
        continue;
      }
      if (isJson && opts.minifyJSON) {
        this.minifyJson(child);
      } else if (isAmpScript && opts.minifyAmpScript) {
        this.minifyAmpScript(child);
      }
    }
  }

  minifyAmpScript(child) {
    const result = Terser.minify(child.data);
    if (result.error) {
      this.log.warn(
          'Could not minify inline amp-script',
          child.data,
          `${result.error.name}: ${result.error.message}`,
      );
      return;
    }
    child.data = result.code;
  }

  minifyJson(child) {
    try {
      child.data = JSON.stringify(JSON.parse(child.data), null, '');
    } catch (e) {
      // log invalid JSON, but don't fail
      this.log.warn('Invalid JSON', child.data);
    }
  }

  isInlineAmpScript(node) {
    return node.attribs &&
      node.attribs.type === 'text/plain' &&
      node.attribs.target === 'amp-script';
  }

  isJson(node) {
    return node.attribs &&
      (node.attribs.type === 'application/json' || node.attribs.type === 'application/ld+json');
  }

  canCollapseWhitespace(tagName) {
    return !/^(?:script|style|pre|textarea)$/.test(tagName);
  }

  canTrimWhitespace(tagName) {
    return !/^(?:pre|textarea)$/.test(tagName);
  }
}

module.exports = MinifyHtml;
