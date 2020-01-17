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

const {AMP_FORMATS, AMP_TAGS} = require('../AmpConstants');

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
        },
      },
      node: {
        tagName: 'meta',
        attribs: {
          name: 'viewport',
          content: 'width=device-width,minimum-scale=1,initial-scale=1',
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
    {
      matcher: {
        tagName: 'link',
        attribs: {
          rel: 'canonical',
        },
      },
      node: {
        tagName: 'link',
        attribs: {
          rel: 'canonical',
          href: (params) => params.canonical,
        },
      },
    },
  ],
};

/**
 * AddMandatoryTags - this transformer will automatically add all missing tags required by a valid AMP document.
 *
 * This transformer will only add missing tags required by a valid AMP documents. However, it won't
 * remove or convert invalid elements. This transformer supports the following option:
 *
 * - `format: [AMP|AMP4EMAIL|AMP4ADS]` - specifies the AMP format. Defaults to `AMP`.
 * - `autoAddBoilerplate: [true|false]` - set to `false` to disable auto adding the boilerplate.
 */
class AddMandatoryTags {
  constructor(config) {
    this.enabled = config.autoAddBoilerplate !== false;
    this.format = config.format || DEFAULT_FORMAT;
    this.log_ = config.log.tag('AddMandatoryTags');
  }

  async transform(tree, params) {
    if (!this.enabled) {
      return;
    }

    // Set default canonical if non is given
    if (!params.canonical) {
      this.log_.warn('No canonical param is given. Setting canonical href to `.`');
      params.canonical = '.';
    }

    // Validate format string
    if (!AMP_FORMATS.includes(this.format)) {
      this.log_.error('Unknown AMPHTML format', this.format);
      return;
    }
    // Only supports AMP for websites
    const boilerplateSpec = BOILERPLATES[this.format];
    if (!boilerplateSpec) {
      this.log_.info('Unsupported AMP format', this.format);
      return;
    }
    // Add the doctype if none is present
    let doctype = tree.root.firstChildByTag('!doctype');
    if (!doctype) {
      doctype = tree.createDocType('html');
      tree.root.insertBefore(doctype, tree.root.firstChild);
    }
    const html = tree.root.firstChildByTag('html');

    // Mark as AMP in html tag if none is present
    if (!Object.keys(html.attribs).some((a) => AMP_TAGS.includes(a))) {
      html.attribs[this.format.toLowerCase()] = '';
    }

    const head = html.firstChildByTag('head');

    // Match each head node against the boilerplate spec, mark
    // all matched nodes by removing them from the set of boilerplate
    // nodes
    const boilerplateRules = new Set(boilerplateSpec);
    let node = head.firstChild;
    while (node) {
      if (node.tagName) {
        boilerplateRules.forEach((spec) => {
          if (this.matchSpec(spec.matcher, node)) {
            boilerplateRules.delete(spec);
          }
        });
      }
      node = node.nextSibling;
    }

    // Add all missing nodes
    for (const spec of boilerplateRules) {
      this.addNode(tree, head, spec.node, params);
    }
  }

  /**
   * @private
   */
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
        if (!value.test(attributeValue)) {
          return false;
        }
      } else if (attributeValue !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * @private
   */
  addNode(tree, parent, nodeSpec, params) {
    const newElement = tree.createElement(nodeSpec.tagName);
    this.addAttributes(nodeSpec, newElement, params);
    this.addChildren(nodeSpec, tree, newElement, params);
    this.addText(nodeSpec, newElement, params);
    parent.appendChild(newElement);
  }

  /**
   * @private
   */
  addText(nodeSpec, newElement, params) {
    if (!nodeSpec.text) {
      return;
    }
    let text;
    if (typeof nodeSpec.text === 'function') {
      text = nodeSpec.text(params);
    } else {
      text = nodeSpec.text;
    }
    newElement.insertText(text);
  }

  /**
   * @private
   */
  addChildren(nodeSpec, tree, newElement, params) {
    if (!nodeSpec.children) {
      return;
    }
    for (const child of nodeSpec.children) {
      this.addNode(tree, newElement, child, params);
    }
  }

  /**
   * @private
   */
  addAttributes(nodeSpec, newElement, params) {
    if (!nodeSpec.attribs) {
      return;
    }
    for (const [key, value] of Object.entries(nodeSpec.attribs)) {
      if (typeof value === 'function') {
        newElement.attribs[key] = value(params);
      } else {
        newElement.attribs[key] = value;
      }
    }
  }
}

module.exports = AddMandatoryTags;
