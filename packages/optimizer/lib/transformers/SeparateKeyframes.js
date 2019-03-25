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

const endingBracketRegex = /}\s+}/g;
const keyframesRegex = /@(-moz-|-webkit-|-o-|)(media|keyframes|supports).+?{[\s\S]+?}}/gmi;

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
    let keyframesText = '';
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

    // Remove spacing between ending brackets e.g. }\n }
    stylesText = stylesText.replace(endingBracketRegex, '}}');
    const keyframes = stylesText.match(keyframesRegex) || {length: 0};

    for (let i = 0; i < keyframes.length; i++) {
      const match = keyframes[i];
      // Remove keyframe from original css
      stylesText = stylesText.replace(match, '');
      // Add keyframes to separate string
      keyframesText += match;
    }

    if (!stylesKeyframesTag) {
      stylesKeyframesTag = body.firstChildByTag('style');

      if (!stylesKeyframesTag || !stylesKeyframesTag.hasAttribute('amp-keyframes')) {
        stylesKeyframesTag = tree.createElement('style', {'amp-keyframes': ''});
      }
    }
    // Insert keyframes styles to Node
    stylesKeyframesTag.insertText(keyframesText);
    // Add keyframes tag to end of document or end of head if no body
    body.children.push(stylesKeyframesTag);
    // Update stylesCustomTag with filtered styles
    stylesCustomTag.children[0].data = stylesText;
  }
}

module.exports = SeparateKeyframes;
