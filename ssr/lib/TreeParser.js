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

const parse5 = require('parse5');
const htmlparser2 = parse5.treeAdapters.htmlparser2;

// Extend Node close with methods required by transformers
const Node = Object.getPrototypeOf(htmlparser2.createDocument());

// Depth-first walk through the DOM tree.
Node.nextNode = function() {
  // Walk downwards if there are children
  const firstChild = this.firstChild;
  if (firstChild) {
    return firstChild;
  }
  // Return the direct sibling or walk upwards until we find a node with sibling
  let node = this;
  while (node) {
    const nextSibling = node.nextSibling;
    if (nextSibling) {
      return nextSibling;
    }
    // Walk upwards
    node = node.parent;
  }
  // We are done
  return null;
};

// Remove node from DOM
Node.remove = function() {
  htmlparser2.detachNode(this);
};

// Append child node
Node.appendChild = function(childNode) {
  if (!childNode) {
    return;
  }
  htmlparser2.appendChild(this, childNode);
};

// Insert node before reference node
Node.insertBefore = function(newNode, referenceNode) {
  if (!newNode) {
    return;
  }

  // If referenceNode is null, the newNode is inserted at the end of the list of child nodes.
  // https://developer.mozilla.org/en-US/docs/Web/API/Node/insertBefore
  if (referenceNode === null) {
    this.appendChild(newNode);
    return;
  }

  htmlparser2.insertBefore(this, newNode, referenceNode);
};

// Append child node
Node.appendAll = function(nodes) {
  if (!nodes) {
    return;
  }
  for (let i = 0, len = nodes.length; i < len; i++) {
    this.appendChild(nodes[i]);
  }
};

// First child by tag
Node.firstChildByTag = function(tag) {
  return this.children.find(
    child => child.tagName && child.tagName.toLowerCase() === tag
  );
};

// First child by tag
Node.hasAttribute = function(attribute) {
  if (!this.attribs) return false;
  return attribute in this.attribs;
};

/**
 * A DOM Tree
 */
class Tree {

  /**
   * @param {obj} htmlparser2 treeAdapter
   * @param {Node} root node
   */
  constructor(htmlparser2, root) {
    this._htmlparser2 = htmlparser2;
    this.root = root;
  }

  /**
   * Creates a new element
   *
   * @param {string} tagName
   * @param {obj} [attribs={}]
   * @returns {Node} new node
   */
  createElement(tagName, attribs) {
    const result = this._htmlparser2.createElement(tagName, '', []);
    if (attribs) {
      result.attribs = attribs;
    }
    return result;
  }

  /**
   * Creates a new text node
   *
   * @param {string} value
   * @returns {Node} new node
   */
  createTextNode(value) {
    return Node.constructor({
      type: 'text',
      data: value,
      parent: null,
      prev: null,
      next: null
    });
  }
}

/**
 * HTML parser and serializer. DOM nodes use htmlparser2 API with custom extensions
 * required by transformers.
 */
class TreeParser {

  constructor(options) {
    this.options = options;
  }

  /**
   * Parses an HTML string.
   *
   * @param {string} html
   * @returns {Node} root node
   */
  parse(html) {
    const root = parse5.parse(html, this.options);
    return new Tree(this.options.treeAdapter, root);
  }

  /**
   * Serializes a tree to an HTML string.
   *
   * @param {Tree} tree
   */
  serialize(tree) {
    return parse5.serialize(tree.root, this.options);
  }
}

module.exports = new TreeParser({
  treeAdapter: htmlparser2
});
