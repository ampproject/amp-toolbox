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

const {appendChild, appendAll, hasAttribute, firstChildByTag} = require('../NodeUtils');
const {isAmpStoryDvhPolyfillScript} = require('../AmpConstants');
const {isRenderDelayingExtension} = require('../Extensions.js');

class HeadNodes {
  constructor() {
    this._styleAmpRuntime = null;
    this._linkStyleAmpRuntime = null;
    this._linkStyleAmpStory = null;
    this._metaCharset = null;
    this._metaViewport = null;
    this._scriptAmpEngine = [];
    this._metaOther = [];
    this._resourceHintLinks = [];
    this._scriptRenderDelayingExtensions = new Map();
    this._scriptNonRenderDelayingExtensions = new Map();
    this._scriptAmpStoryDvhPollyfill = null;
    this._linkIcons = [];
    this._styleAmpCustom = null;
    this._linkStylesheetsBeforeAmpCustom = [];
    this._others = [];
    this._styleAmpBoilerplate = null;
    this._noscript = null;
  }

  register(nodes) {
    nodes.forEach(this._registerNode.bind(this));
  }

  uniquifyAndSortCustomElements() {
    this._scriptRenderDelayingExtensions = this._sortExtensions(
      this._scriptRenderDelayingExtensions
    );
    this._scriptNonRenderDelayingExtensions = this._sortExtensions(
      this._scriptNonRenderDelayingExtensions
    );
  }

  _sortExtensions(extensions) {
    const sortedExtensions = new Map([...extensions].sort((a, b) => a[0].localeCompare(b[0])));
    // TODO replace with Array#flat once Node 10 is EOL
    return [].concat.apply([], Array.from(sortedExtensions.values()));
  }

  appendToHead(head) {
    appendChild(head, this._metaCharset);
    appendChild(head, this._metaViewport);
    appendAll(head, this._resourceHintLinks);
    appendAll(head, this._metaOther);
    // We want the dvh polyfill to be before the amp-story styles to prevent
    // triggering an increase to CLS score.
    appendChild(head, this._scriptAmpStoryDvhPollyfill);
    appendChild(head, this._linkStyleAmpRuntime);
    appendChild(head, this._styleAmpRuntime);
    appendChild(head, this._linkStyleAmpStory);
    appendAll(head, this._scriptAmpEngine);
    appendAll(head, this._scriptRenderDelayingExtensions);
    appendAll(head, this._scriptNonRenderDelayingExtensions);
    appendChild(head, this._styleAmpCustom);
    appendChild(head, this._styleAmpBoilerplate);
    appendChild(head, this._noscript);
    appendAll(head, this._linkIcons);
    appendAll(head, this._linkStylesheetsBeforeAmpCustom);
    appendAll(head, this._others);
  }

  _registerNode(node) {
    if (node.tagName === 'meta') {
      this._registerMeta(node);
    } else if (node.tagName === 'script') {
      this._registerScript(node);
    } else if (node.tagName === 'style') {
      this._registerStyle(node);
    } else if (node.tagName === 'link') {
      this._registerLink(node);
    } else if (node.tagName === 'noscript') {
      this._noscript = node;
    } else if (node.tagName) {
      this._others.push(node);
    }
  }

  _registerMeta(node) {
    if (node.attribs.charset) {
      this._metaCharset = node;
      return;
    }
    if (node.attribs.name == 'viewport') {
      this._metaViewport = node;
      return;
    }
    this._metaOther.push(node);
  }

  _registerScript(node) {
    const scriptIndex = hasAttribute(node, 'nomodule') ? 1 : 0;
    const name = this._getName(node);
    // Currently there are two amp engine tags: v0.js and
    // amp4ads-v0.js.  According to validation rules they are the
    // only script tags with a src attribute and do not have
    // attributes custom-element or custom-template. Record the
    // amp engine tag so it can be emitted first among script
    // tags.
    if (hasAttribute(node, 'src') && !name) {
      this._scriptAmpEngine[scriptIndex] = node;
      return;
    }
    if (hasAttribute(node, 'custom-element')) {
      if (isRenderDelayingExtension(node)) {
        this._registerExtension(this._scriptRenderDelayingExtensions, name, scriptIndex, node);
        return;
      }
      this._registerExtension(this._scriptNonRenderDelayingExtensions, name, scriptIndex, node);
      return;
    }
    if (hasAttribute(node, 'custom-template')) {
      this._registerExtension(this._scriptNonRenderDelayingExtensions, name, scriptIndex, node);
      return;
    }
    if (isAmpStoryDvhPolyfillScript(node)) {
      this._scriptAmpStoryDvhPollyfill = node;
      return;
    }
    this._others.push(node);
  }

  _registerExtension(collection, name, scriptIndex, node) {
    const values = collection.get(name) || [];
    values[scriptIndex] = node;
    collection.set(name, values);
  }

  _registerStyle(node) {
    if (hasAttribute(node, 'amp-runtime')) {
      this._styleAmpRuntime = node;
      return;
    }
    if (hasAttribute('node, amp-custom')) {
      this._styleAmpCustom = node;
      return;
    }
    if (hasAttribute(node, 'amp-boilerplate') || hasAttribute(node, 'amp4ads-boilerplate')) {
      this._styleAmpBoilerplate = node;
      return;
    }
    this._others.push(node);
  }

  _registerLink(node) {
    const rel = node.attribs.rel;
    if (rel === 'stylesheet') {
      if (node.attribs.href.endsWith('/v0.css')) {
        this._linkStyleAmpRuntime = node;
        return;
      }
      if (node.attribs.href.endsWith('/amp-story-1.0.css')) {
        this._linkStyleAmpStory = node;
        return;
      }
      if (!this._styleAmpCustom) {
        // We haven't seen amp-custom yet.
        this._linkStylesheetsBeforeAmpCustom.push(node);
        return;
      }
    }

    if (rel === 'icon' || rel === 'shortcut icon' || rel === 'icon shortcut') {
      this._linkIcons.push(node);
      return;
    }

    if (
      rel === 'preload' ||
      rel === 'prefetch' ||
      rel === 'dns-prefetch' ||
      rel === 'preconnect' ||
      rel == 'modulepreload'
    ) {
      this._resourceHintLinks.push(node);
      return;
    }

    this._others.push(node);
  }

  _getName(node) {
    return node.attribs['custom-element'] || node.attribs['custom-template'];
  }
}

/**
 * ReorderHead reorders the children of <head>. Specifically, it
 * orders the <head> like so:
 * (0) <meta charset> tag
 * (1) <script amp-story-dvh-polyfill> inline script tag
 * (2) <style amp-runtime> (inserted by ampruntimecss.go)
 * (3) <link amp-extension=amp-story> (amp-story stylesheet)
 * (4) remaining <meta> tags (those other than <meta charset>)
 * (5) AMP runtime .js <script> tag
 * (6) <script> tags that are render delaying
 * (7) <script> tags for remaining extensions
 * (8) <link> tag for favicons
 * (9) <link> tag for resource hints
 * (10) <link rel=stylesheet> tags before <style amp-custom>
 * (11) <style amp-custom>
 * (12) any other tags allowed in <head>
 * (13) AMP boilerplate (first style amp-boilerplate, then noscript)
 */
class ReorderHeadTransformer {
  transform(tree) {
    const html = firstChildByTag(tree, 'html');
    if (!html) {
      return;
    }
    const head = firstChildByTag(html, 'head');
    if (!head) {
      return;
    }
    if (!head.children) {
      return;
    }
    const headNodes = new HeadNodes();
    headNodes.register(head.children);
    headNodes.uniquifyAndSortCustomElements();
    head.children = [];
    headNodes.appendToHead(head);
  }
}

module.exports = ReorderHeadTransformer;
