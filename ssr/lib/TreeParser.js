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
   * @returns {Node} new node
   */
  createElement(tagName) {
    return this._htmlparser2.createElement(tagName, '', {});
  }

  /**
   * Creates a new text node
   *
   * @param {string} value
   * @returns {Node} new node
   */
  createTextNode(value) {
    return this._htmlparser2.createTextNode(value);
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
