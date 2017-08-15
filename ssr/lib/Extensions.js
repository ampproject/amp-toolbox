'mode strict';

module.exports = {
  isRenderDelayingExtension: function(script) {
    if (script.tagName !== 'script') {
      return false;
    }
    const extension = script.attribs['custom-element'];
    return extension === 'amp-dynamic-css-classes' ||
      extension === 'amp-experiment';
  },
  isCustomElement: function(node) {
    return node.tagName && node.tagName.startsWith('amp-');
  }
};
