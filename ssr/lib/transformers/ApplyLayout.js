'use strict';

const {
  parseLayout,
  cssLength,
  calculateHeight,
  calculateWidth,
  calculateLayout,
  getLayoutClass,
  isLayoutSizeDefined,
  getLayoutSizeDefinedClass
} = require('../ParseLayout.js');

const SUPPORTED_LAYOUTS = ['', 'nodisplay', 'fixed', 'fixed-height', 'responsive',
  'container', 'fill', 'flex-item'];

function isSupportedLayout(layout) {
  return SUPPORTED_LAYOUTS.indexOf(layout) > -1;
}

function getAttributeOrNull(element, name) {
  return element.hasAttribute(name) ? element.attribs[name] : null;
}

function addClass(node, value) {
  node.attribs.class = node.hasAttribute('class') ? node.attribs.class + ' ' + value : value;
}

function apply(layout, width, height, node) {
  addClass(node, getLayoutClass(layout));
  if (isLayoutSizeDefined(layout)) {
    addClass(node, getLayoutSizeDefinedClass());
  }

  let styles = '';
  switch (layout) {
    case 'nodisplay':
      styles = 'display:none;';
      break;
    case 'fixed':
      styles = `width:${width.numeral}${width.unit};height:${height.numeral}${height.unit};`;
      break;
    case 'fixed-height':
      styles = `height:${height.numeral}${height.unit};`;
      break;
    case 'responsive':
      // Do nothing here, but emit <i-amphtml-sizer> later.
      break;
    case 'fill':
    case 'container':
      // Do nothing here.
      break;
    case 'flex-item':
      if (width.isSet) {
        styles = `width:${width.numeral}${width.unit};`;
      }
      if (height.isSet) {
        styles += `height:${height.numeral}${height.unit};`;
      }
      break;
    default:
      // Do nothing.
  }
  // We prepend just in case an existing value (which shouldn't be there for
  // valid docs) doesn't end with ';'.
  node.attribs.style = styles + (node.attribs.style ? node.attribs.style : '');
  if (node.attribs.style === '') {
    delete node.attribs.style;
  }

  node.attribs['i-amphtml-layout'] = layout;
}

function maybeAddSizerInto(node, tree, layout, width, height) {
  if (layout !== 'responsive' || !width.isSet || width.numeral === 0 ||
     !height.isSet || width.unit !== height.unit) {
    return;
  }

  const padding = height.numeral / width.numeral * 100;
  const sizer = tree.createElement('i-amphtml-sizer');
  sizer.attribs.style = `display:block;padding-top:${padding.toFixed(4)}%;`;
  const referenceNode = node.children && node.children.length ? node.children[0] : null;
  node.insertBefore(sizer, referenceNode);
}

module.exports = {
  applyLayout: function(customElement, tree) {
    const ampLayout = parseLayout(customElement.attribs.layout);
    const inputWidth = cssLength(getAttributeOrNull(customElement, 'width'), false);
    if (!inputWidth.isValid) {
      return false;
    }
    const inputHeight = cssLength(getAttributeOrNull(customElement, 'height'), false);
    if (!inputHeight.isValid) {
      return false;
    }

    // Calculate effective height, width and layout.
    const height = calculateHeight(ampLayout, inputHeight, customElement.tagName);
    const width = calculateWidth(ampLayout, inputWidth, customElement.tagName);

    const layout = calculateLayout(ampLayout, width, height,
      getAttributeOrNull(customElement, 'sizes'), getAttributeOrNull(customElement, 'heights'));

    if (!isSupportedLayout(layout)) {
      return false;
    }

    apply(layout, width, height, customElement);
    maybeAddSizerInto(customElement, tree, layout, width, height);
    return true;
  }
};
