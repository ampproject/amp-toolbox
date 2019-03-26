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

const css = require('css');
const stringifyOptions = {indent: 0, compress: true};
/**
 * SeparateKeyframes - moves keyframes, media, and support from amp-custom
 * to amp-keyframes.
 */
class SeparateKeyframes {
  transform(tree) {
    const html = tree.root.firstChildByTag('html');
    if (!html) return;
    const head = html.firstChildByTag('head');
    if (!head) return;
    const body = html.firstChildByTag('body') || head;
    let stylesCustomTag;
    let stylesKeyframesTag;
    const headTags = head.children;

    for (let i = 0; i < headTags.length; i++) {
      const tag = headTags[i];
      if (tag.tagName !== 'style') continue;

      if (!stylesKeyframesTag && tag.hasAttribute('amp-keyframes')) {
        stylesKeyframesTag = tag;
      }
      if (!stylesCustomTag && tag.hasAttribute('amp-custom')) {
        stylesCustomTag = tag;
      }
    }

    // If no custom styles, there's nothing to do
    if (!stylesCustomTag) return;
    let stylesText = stylesCustomTag.children[0];

    if (!stylesText || !stylesText.data) return;
    stylesText = stylesText.data;

    const cssTree = css.parse(stylesText);
    const keyframesTree = {
      type: 'stylesheet',
      stylesheet: {
        rules: [],
      },
    };

    cssTree.stylesheet.rules = cssTree.stylesheet.rules.filter((rule) => {
      const doMove = (
        rule.type === 'media' ||
        rule.type === 'supports' ||
        rule.type === 'keyframes'
      );
      if (doMove) {
        keyframesTree.stylesheet.rules.push(rule);
      }
      return !doMove;
    });

    // if no rules moved nothing to do
    if (!keyframesTree.stylesheet.rules.length) return;
    let hadKeyframesTag = true;

    if (!stylesKeyframesTag) {
      stylesKeyframesTag = body.firstChildByTag('style');

      if (!stylesKeyframesTag ||
        !stylesKeyframesTag.hasAttribute('amp-keyframes')
      ) {
        hadKeyframesTag = false;
        stylesKeyframesTag = tree.createElement('style', {'amp-keyframes': ''});
      }
    }
    // Insert keyframes styles to Node
    const keyframesTextNode = stylesKeyframesTag.children[0];
    const currentKeyframesTree = css.parse(
        keyframesTextNode && keyframesTextNode.data || ''
    );
    currentKeyframesTree.stylesheet.rules = (
      currentKeyframesTree.stylesheet.rules.concat(
          keyframesTree.stylesheet.rules
      )
    );
    const keyframesText = css.stringify(currentKeyframesTree, stringifyOptions);

    if (!keyframesTextNode) {
      stylesKeyframesTag.insertText(keyframesText);
    } else {
      keyframesTextNode.data = keyframesText;
    }

    // Add keyframes tag to end of document or end of head if no body
    if (!hadKeyframesTag) body.children.push(stylesKeyframesTag);
    // Update stylesCustomTag with filtered styles
    stylesCustomTag.children[0].data = css.stringify(cssTree, stringifyOptions);
  }
}

module.exports = SeparateKeyframes;
