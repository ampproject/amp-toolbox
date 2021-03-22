/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
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

// Images smaller than 150px are considered tiny
const TINY_IMG_THRESHOLD = 150;

/**
 * Checks if an amp-img qualifies as a hero image.
 *
 * @param {string} src the src attribute
 * @param {string} layout the layout attribute
 * @param {string} width the width attribute
 * @param {string} height the height attribute
 * @return {boolean}  true if amp-img qualifies as a hero image
 */
function isHeroImageCandidate({src, layout, width, height}) {
  if (!src) {
    return false;
  }
  if (!isValidImageSrcURL(src)) {
    return false;
  }
  if (!width && !height) {
    return false;
  }
  if (isTinyNode(layout, width, height)) {
    return false;
  }
  return true;
}

// Any node with width or height less than 150 pixels and a non-responsive layout.
function isTinyNode(layout, width, height) {
  if (width <= 0 || height <= 0) return true;
  if (layout === 'intrinsic' || layout === 'responsive') {
    return false;
  }
  return width < TINY_IMG_THRESHOLD || height < TINY_IMG_THRESHOLD;
}

/**
 * Returns true if the string specifies an image src URL (relative or absolute using http or https).
 *
 * @param {string} src the input string
 * @returns {boolean}
 */
function isValidImageSrcURL(src) {
  try {
    return new URL(src, 'https://example.com').protocol.startsWith('http');
  } catch (e) {
    // invalid URL
    return false;
  }
}

module.exports = isHeroImageCandidate;
