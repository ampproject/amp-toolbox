'use strict';

/**
 * AmpBoilerplateTransformer - This DOM transformer locates
 * style and noscript tags in the head and removes them if
 * static layout is being applied server side which needs to have the
 * https://cdn.ampproject.org/v0.css CSS added (known by the presence
 * of <style amp-runtime> tag). Ideally this would be inlined within the
 * <style amp-runtime> tag.
 */
class AmpBoilerplateTransformer {

  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    if (!head) {
      return; // invalid doc
    }
    // amp-runtime is added by server-side-rendering
    const ampRuntimeStyle = this._findAmpRuntimeStyle(head);
    if (!ampRuntimeStyle) {
      return; // keep existing boilerplate
    }
    this._stripStylesAndNoscript(head);
    this._addStaticCss(tree, ampRuntimeStyle);
  }

  _findAmpRuntimeStyle(head) {
    let node = head.firstChild;
    while (node) {
      if (node.hasAttribute('amp-runtime')) {
        return node;
      }
      node = node.nextSibling;
    }
    return null;
  }

  _addStaticCss(tree, node) {
    const cssStyleNode = tree.createElement('link');
    // TODO inline once createElement fix is submitted
    cssStyleNode.attribs = {
      rel: 'stylesheet',
      href: 'https://cdn.ampproject.org/v0.css'
    };
    node.parent.insertBefore(cssStyleNode, node);
  }

  _stripStylesAndNoscript(head) {
    let node = head.firstChild;
    while (node) {
      const nextNode = node.nextSibling;
      if (this._isRemovableStyle(node) || this._isNoscript(node)) {
        node.remove(); // remove existing boilerplate
      }
      node = nextNode;
    }
  }

  _isRemovableStyle(node) {
    return node.tagName === 'style' &&
      !node.hasAttribute('amp-custom') &&
      !node.hasAttribute('amp-runtime');
  }

  _isNoscript(node) {
    return node.tagName === 'noscript';
  }
}

module.exports = new AmpBoilerplateTransformer();
