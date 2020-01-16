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

const {AMP_FORMATS} = require('../AmpConstants');

const DEFAULT_FORMAT = 'AMP';

const BOILERPLATES = {
  AMP: [
    {
      matcher: {
        tagName: 'meta',
        attribs: {
          charset: 'utf-8',
        },
      },
      node: {
        tagName: 'meta',
        attribs: {
          charset: 'utf-8',
        },
      },
    },
    {
      matcher: {
        tagName: 'meta',
        attribs: {
          name: 'viewport',
          content: 'width=device-width,minimum-scale=1',
        },
      },
      node: {
        tagName: 'meta',
        attribs: {
          name: 'viewport',
          content: 'width=device-width,minimum-scale=1',
        },
      },
    },
    {
      matcher: {
        tagName: 'noscript',
      },
      node: {
        tagName: 'noscript',
        children: [
          {
            tagName: 'style',
            attribs: {
              'amp-boilerplate': '',
            },
            // eslint-disable-next-line max-len
            text: 'body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}',
          },
        ],
      },
    },
    {
      matcher: {
        tagName: 'style',
        attribs: {
          'amp-boilerplate': '',
        },
      },
      node: {
        tagName: 'style',
        attribs: {
          'amp-boilerplate': '',
        },
        // eslint-disable-next-line max-len
        text: 'body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}',
      },
    },
    {
      matcher: {
        tagName: 'script',
        attribs: {
          src: /^https:\/\/.+\/v0\.js$/,
        },
      },
      node: {
        tagName: 'script',
        attribs: {
          async: '',
          src: 'https://cdn.ampproject.org/v0.js',
        },
      },
    },
  ],
};

/**
 * Auto Add Boilerplate - this transformer will automatically add all missing parts of the AMP Boilerplate code.
 *
 * This transformer will only add missing or fix invalid boilerplate code. However, it won't remove invalid elements.
 *
 * This transformer supports the following option:
 *
 * - `format: [AMP|AMP4EMAIL|AMP4ADS]` - specifies the AMP format. Defaults to `AMP`.
 * - `autoAddBoilerplate: [true|false]` - set to `false` to disable auto adding the boilerplate.
 */
class AutoAddBoilerplate {
  constructor(config) {
    this.enabled = config.autoAddBoilerplate !== false;
    this.format = config.format || DEFAULT_FORMAT;
    this.log_ = config.log.tag('AutoAddBoilerplate');
  }

  async transform(tree, params) {
    if (!this.enabled) {
      return;
    }
    if (!AMP_FORMATS.includes(this.format)) {
      this.log_.error('Unsupported AMPHTML format', this.format);
      return;
    }
    const boilerplateSpec = new Set(BOILERPLATES[this.format]);
    console.log(tree.root);
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    if (!head) return;

    let node = head.firstChild;
    while (node) {
      if (node.tagName) {
        boilerplateSpec.forEach((spec) => {
          if (this.matchSpec(spec.matcher, node)) {
            boilerplateSpec.delete(spec);
          }
        });
      }
      node = node.nextSibling;
    }

    for (const spec of boilerplateSpec) {
      this.addNode(tree, head, spec.node);
    }
  }

  matchSpec(matcher, node) {
    if (matcher.tagName !== node.tagName) {
      return false;
    }
    if (!matcher.attribs) {
      return true;
    }
    for (const [key, value] of Object.entries(matcher.attribs)) {
      const attributeValue = node.attribs[key];
      if (value instanceof RegExp) {
        console.log('regex', attributeValue, value.test(attributeValue));
      }
      if (value instanceof RegExp) {
        if (!value.test(attributeValue)) {
          return false;
        }
      } else if (attributeValue !== value) {
        return false;
      }
    }
    return true;
  }

  addNode(tree, node, matcher) {
    const newElement = tree.createElement(matcher.tagName, matcher.attribs);
    for (const child of matcher.children || []) {
      this.addNode(tree, newElement, child);
    }
    if (matcher.text) {
      newElement.insertText(matcher.text);
    }
    node.appendChild(newElement);
  }
}

module.exports = AutoAddBoilerplate;
