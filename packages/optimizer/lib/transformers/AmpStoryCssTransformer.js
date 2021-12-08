const {skipNodeAndChildren} = require('../HtmlDomHelper');
const {
  isTemplate,
  AMP_STORY_DVH_POLYFILL_ATTR,
  isAmpStoryDvhPolyfillScript,
} = require('../AmpConstants');
const {
  insertText,
  hasAttribute,
  remove,
  createElement,
  nextNode,
  firstChildByTag,
  appendChild,
} = require('../NodeUtils');
const {AMP_CACHE_HOST} = require('../AmpConstants.js');

// This string should not be modified, even slightly. This string is strictly
// checked by the validator.
const AMP_STORY_DVH_POLYFILL_CONTENT =
  '"use strict";if(!self.CSS||!CSS.supports||!CSS.supports("height:1dvh")){function e(){document.documentElement.style.setProperty("--story-dvh",innerHeight/100+"px","important")}addEventListener("resize",e,{passive:!0}),e()}';

const ASPECT_RATIO_ATTR = 'aspect-ratio';

class AmpStoryCssTransformer {
  constructor(config) {
    this.log_ = config.log.tag('AmpStoryCssTransformer');

    this.enabled_ = config.optimizeAmpStory === true;

    if (!this.enabled_) {
      this.log_.debug('disabled');
    }
  }

  transform(root) {
    if (!this.enabled_) return;

    const html = firstChildByTag(root, 'html');
    if (!html) return;

    const head = firstChildByTag(html, 'head');
    if (!head) return;

    const body = firstChildByTag(html, 'body');
    if (!body) return;

    let hasAmpStoryScript = false;
    let hasAmpStoryDvhPolyfillScript = false;
    let styleAmpCustom = null;

    for (let node = head.firstChild; node !== null; node = node.nextSibling) {
      if (isAmpStoryScript(node)) {
        hasAmpStoryScript = true;
        continue;
      }

      if (isAmpStoryDvhPolyfillScript(node)) {
        hasAmpStoryDvhPolyfillScript = true;
        continue;
      }

      if (isStyleAmpCustom(node)) {
        styleAmpCustom = node;
        continue;
      }
    }

    // We can return early if no amp-story script is found.
    if (!hasAmpStoryScript) return;

    appendAmpStoryCssLink(head);

    if (styleAmpCustom) {
      modifyAmpCustomCSS(styleAmpCustom);
      // Make sure to not double install the dvh polyfill.
      if (!hasAmpStoryDvhPolyfillScript) {
        appendAmpStoryDvhPolyfillScript(head);
      }
    }

    supportsLandscapeSSR(body, html);

    aspectRatioSSR(body);
  }
}

function modifyAmpCustomCSS(style) {
  if (!style.children) return;
  const children = style.children;
  // Remove all text children from style.
  // NOTE(erwinm): Is it actually possible in htmlparser2 to have multiple
  // text children?
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type == 'text' && child.data) {
      const newText = child.data.replace(
        /(-?[\d.]+)v(w|h|min|max)/gim,
        'calc($1 * var(--story-page-v$2))'
      );
      remove(child);
      insertText(style, newText);
    }
  }
}

function supportsLandscapeSSR(body, html) {
  const story = firstChildByTag(body, 'amp-story');
  if (!story) return;
  if (hasAttribute(story, 'supports-landscape') && html.attribs) {
    html.attribs['data-story-supports-landscape'] = '';
  }
}

function aspectRatioSSR(body) {
  for (let node = body; node !== null; node = nextNode(node)) {
    if (isTemplate(node)) {
      node = skipNodeAndChildren(node);
      continue;
    }

    if (!isAmpStoryGridLayer(node)) continue;

    const {attribs} = node;
    if (!attribs || !attribs[ASPECT_RATIO_ATTR] || typeof attribs[ASPECT_RATIO_ATTR] !== 'string') {
      continue;
    }

    const aspectRatio = attribs[ASPECT_RATIO_ATTR].replace(/:/g, '/');
    // We need to a `attribs['style'] || ''` in case there is no style attribute as we
    // don't want to coerce "undefined" or "null" into a string.
    attribs['style'] = `--${ASPECT_RATIO_ATTR}:${aspectRatio};${attribs['style'] || ''}`;
  }
}

function appendAmpStoryCssLink(head) {
  const ampStoryCssLink = createElement('link', {
    'rel': 'stylesheet',
    'amp-extension': 'amp-story',
    // We rely on the `RewriteAmpUrls` transformer to modify this to
    // the correct LTS or correct rtv path.
    'href': `${AMP_CACHE_HOST}/v0/amp-story-1.0.css`,
  });
  appendChild(head, ampStoryCssLink);
}

function appendAmpStoryDvhPolyfillScript(head) {
  const ampStoryDvhPolyfillScript = createElement('script', {
    [AMP_STORY_DVH_POLYFILL_ATTR]: '',
  });
  insertText(ampStoryDvhPolyfillScript, AMP_STORY_DVH_POLYFILL_CONTENT);
  appendChild(head, ampStoryDvhPolyfillScript);
}

function isAmpStoryGridLayer(node) {
  return node.tagName === 'amp-story-grid-layer';
}

function isAmpStoryScript(node) {
  return (
    node.tagName === 'script' && node.attribs && node.attribs['custom-element'] === 'amp-story'
  );
}

function isStyleAmpCustom(node) {
  return node.tagName === 'style' && hasAttribute(node, 'amp-custom');
}

/** @module AmpStoryCssTransformer */
module.exports = AmpStoryCssTransformer;
