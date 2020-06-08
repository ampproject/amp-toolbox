/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
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

const {createElement, hasAttribute, insertAfter, firstChildByTag} = require('../NodeUtils');
const {findMetaViewport} = require('../HtmlDomHelper');
const {isValidImageSrcURL} = require('../URLUtils');
const {isTemplate} = require('../AmpConstants');
const parseSrcSet = require('../parseSrcSet');

// Images smaller than 150px are considered tiny
const TINY_IMG_THRESHOLD = 150;

/**
 * PreloadHeroImage - This transformer identifies a hero image or
 * important images on the document and attaches <link rel="preload"> element. It
 * will only add a hero image if there is not already an existing image preload.
 *
 * This transformer supports the following option:
 *
 * * `preloadHeroImage`: [true|false] - enables or disables hero image preloading. The default is `true`.
 */
class PreloadHeroImage {
  constructor(config) {
    this.log = config.log;
    this.enabled = config.preloadHeroImage !== false;
  }
  async transform(root, params) {
    if (!this.enabled || params.preloadHeroImage === false) {
      return;
    }
    const html = firstChildByTag(root, 'html');
    const head = firstChildByTag(html, 'head');
    const body = firstChildByTag(html, 'body');
    if (!body || !head) return;

    if (this.hasExistingImagePreload(head)) {
      return;
    }

    const heroImage = this.findHeroImage(body);

    if (!heroImage) {
      return;
    }
    let referenceNode = findMetaViewport(head);

    const preload = createElement('link', {
      'rel': 'preload',
      'href': heroImage.src,
      'as': 'image',
      'data-hero': '',
    });
    if (heroImage.media) {
      preload.attribs.media = heroImage.media;
    }
    if (heroImage.srcset) {
      this.log.debug(
        "Could not preload hero image as it's using srcset, which is currently only supported Chromium-based browsers (see https://web.dev/preload-responsive-images/).",
        heroImage.src
      );
      return;
    }
    insertAfter(head, preload, referenceNode);
  }

  hasExistingImagePreload(head) {
    return head.children.some(this.isImagePreload);
  }

  isImagePreload(node) {
    if (node.tagName !== 'link') {
      return false;
    }
    if (!hasAttribute(node, 'rel')) {
      return false;
    }
    if (node.attribs.rel !== 'preload') {
      return false;
    }
    return node.attribs.as === 'image';
  }

  findHeroImage(root) {
    if (!root.tagName) {
      return null;
    }
    // Ignore images inside templates
    if (isTemplate(root)) {
      return null;
    }

    const layout = root.attribs ? root.attribs.layout : '';
    if (layout === 'nodisplay') return null;

    if (root.tagName === 'amp-img') {
      return this.isCandidateImageForPreloading(root);
    }
    if (root.tagName === 'amp-video') {
      return this.isCandidateVideoPosterImage(root);
    }
    if (root.tagName === 'amp-iframe' || root.tagName === 'amp-video-iframe') {
      return this.isCandidateIframePlaceholderImage(root);
    }

    let heroImage;
    for (const child of root.children) {
      const heroImage = this.findHeroImage(child);
      if (heroImage) {
        return heroImage;
      }
    }
    return null;
  }

  // For a given <amp-video> node or any node that has poster attribute, and
  // qualifies as hero image, returns the HeroImageSrcs.
  isCandidateVideoPosterImage(ampVideo) {
    const poster = ampVideo.attribs.poster;
    if (!poster) return null;
    if (!isValidImageSrcURL(poster)) {
      return null;
    }

    const {layout, width, height, media} = ampVideo.attribs;
    if (this.isTinyNode(layout, width, height)) {
      return null;
    }
    return {src: poster, media, srcset: ''};
  }

  isCandidateIframePlaceholderImage(ampIframe) {
    // Placeholder amp-img is required to preload image for iframe.
    if (!ampIframe.children || ampIframe.children.length === 0) {
      return null;
    }

    const {layout, width, height, media} = ampIframe.attribs;

    if (this.isTinyNode(layout, width, height)) return null;

    for (const child of ampIframe.children) {
      if (
        child.tagName === 'amp-img' &&
        hasAttribute(child, 'placeholder') &&
        isValidImageSrcURL(child.attribs.src)
      ) {
        return {src: child.attribs.src, media, srcset: child.attribs.srcset || ''};
      }
    }
    return null;
  }

  // Checks if node qualifies to be a hero image. Returns HeroImageSrcs if the
  // node is a hero image. The hero image here can come from one of <amp-img>,
  // <amp-video>, <amp-iframe>, <amp-video-iframe>.
  isCandidateImageForPreloading(ampImg) {
    const src = ampImg.attribs.src;
    if (!src) {
      return null;
    }
    if (!isValidImageSrcURL(src)) {
      return null;
    }

    let {width, height, srcset, layout, media} = ampImg.attribs;

    if (!width && !height) {
      if (layout === 'fill') {
        ({width, height} = this.nodeDimensionsFromParent(ampImg));
      } else {
        return null;
      }
    }
    if (this.isTinyNode(layout, width, height)) {
      return null;
    }
    return {src, srcset, media};
  }

  // Any node with width or height less than 150 pixels and a non-responsive layout.
  isTinyNode(layout, width, height) {
    if (width <= 0 || height <= 0) return true;
    if (layout === 'intrinsic' || layout === 'responsive') {
      return false;
    }
    return (width > 0 && width < TINY_IMG_THRESHOLD) || (height > 0 && height < TINY_IMG_THRESHOLD);
  }

  nodeDimensionsFromParent(node) {
    while (node.parent) {
      node = node.parent;
      if (!node.attribs) {
        continue;
      }
      const width = node.attribs.width;
      const height = node.attribs.height;
      if (!width && !height) {
        continue;
      }
      return {width, height};
    }
    return {width: 0, height: 0};
  }
}

/** @module PreloadHeroImage */
module.exports = PreloadHeroImage;
