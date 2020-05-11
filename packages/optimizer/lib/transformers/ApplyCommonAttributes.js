/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const {appendChild, createElement, insertText, hasAttribute} = require('../NodeUtils');
const ID_PREFIX = 'i-amp-';

class ApplyCommonAttributes {
  constructor(log) {
    this.log = log;
    this.attributesToRemove = [];
    this.canRemoveBoilerplate = true;
    this.styles = new Map();
    this.attributeTransformations = {
      media: this.applyMediaAttribute.bind(this),
    };
    this.counter = 0;
    this.nodes = [];
  }

  applyToNode(node) {
    if (!node.attribs) {
      return;
    }
    for (const [attribute, transform] of Object.entries(this.attributeTransformations)) {
      if (hasAttribute(node, attribute)) {
        try {
          transform(node);
          this.nodes.push(node);
        } catch (e) {
          this.log.error(e.message);
          this.canRemoveBoilerplate = false;
        }
      }
    }
  }

  addSelector(media, selector) {
    const selectors = this.styles.get(media) || [];
    selectors.push(selector);
    this.styles.set(media, selectors);
  }

  applyToCustomStyles(head, customStyles) {
    if (this.styles.size === 0) {
      return;
    }
    if (!customStyles) {
      customStyles = createElement('style', {
        'amp-custom': '',
      });
      appendChild(head, customStyles);
      insertText(customStyles, '');
    }
    customStyles.children[0].data += this.generateStyles();
    for (const node of this.nodes) {
      for (const attribute of Object.keys(this.attributeTransformations)) {
        delete node.attribs[attribute];
      }
    }
  }

  generateStyles() {
    let result = '';
    for (const [media, selectors] of this.styles.entries()) {
      result += `@media ${media}{${selectors.join(',')}{display:none}}`;
    }
    return result;
  }

  applyMediaAttribute(node) {
    const elementId = this.getOrCreateId(node);
    // normalize whitespace
    let mediaString = node.attribs.media.replace(/\s+/g, ' ');
    mediaString = mediaString.trim();
    if (!mediaString) {
      return;
    }

    if (mediaString[0] === '(') {
      mediaString = `all and ${mediaString}`;
    }

    if (mediaString.startsWith('not ')) {
      mediaString = mediaString.substring(4);
    } else {
      mediaString = `not ${mediaString}`;
    }

    this.addSelector(mediaString, `#${elementId}`);
  }

  getOrCreateId(node) {
    if (hasAttribute(node, 'id')) {
      return node.attribs.id;
    }
    node.attribs = node.attribs || [];
    node.attribs.id = ID_PREFIX + this.counter;
    this.counter++;
    return node.attribs.id;
  }

  applySizesAttribute(node) {
    if (!node.attribs.srcset) {
      // According to the Mozilla docs, a sizes attribute without a valid srcset attribute should have no effect.
      // Therefore, it should simply be stripped, without producing media queries.
      // @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-sizes
      return;
  }
  return $this->extractAttributeCss(
    $document,
    $element,
    $attribute,
    '#__ID__{width:%s}',
    '@media %s{#__ID__{width:%s}}'
);
  }
}

module.exports = ApplyCommonAttributes;
