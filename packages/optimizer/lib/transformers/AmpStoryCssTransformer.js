const {skipNodeAndChildren} = require('../HtmlDomHelper');
const {isTemplate, AMP_CACHE_HOST} = require('../AmpConstants');
const {calculateHost} = require('../RuntimeHostHelper');
const {
  insertText,
  setAttribute,
  hasAttribute,
  remove,
  createElement,
  insertBefore,
  nextNode,
  firstChildByTag,
  appendChild,
} = require('../NodeUtils');

const AMP_STORY_DVH_POLYFILL_CONTENT =
  '"use strict";if(!self.CSS||!CSS.supports||!CSS.supports("height:1dvh")){function e(){document.documentElement.style.setProperty("--story-dvh",innerHeight/100+"px","important")}addEventListener("resize",e,{passive:!0}),e()})';

const AMP_STORY_DVH_POLYFILL_ATTR = 'amp-story-dvh-polyfill';
const ASPECT_RATIO_ATTR = 'aspect-ratio';

class AmpStoryCssTransformer {
  constructor(config) {
    this.log_ = config.log.tag('AmpStoryCssTransformer');

    this.enabled_ = !!config.optimizeAmpStory;

    if (!this.enabled_) {
      this.log_.debug('disabled');
    }
  }

  transform(root, params) {
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

    if (!hasAmpStoryScript) return;

    const host = calculateHost(params);

    appendAmpStoryCssLink(host, head);

    if (styleAmpCustom) {
      //modifyAmpCustomCSS();
      //appendAmpStoryDvhPolyfillScript();
    }

    supportsLandscapeSSR(body, html);

    aspectRatioSSR(body);
  }
}

function modifyAmpCustomCSS(style) {}

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

    const aspectRatio = attribs[ASPECT_RATIO_ATTR].replace(':', '/');
    // We need to a `attribs['style'] || ''` in case there is no style attribute as we
    // don't want to coerce "undefined" or "null" into a string.
    attribs['style'] = `--${ASPECT_RATIO_ATTR}:${aspectRatio};${attribs['style'] || ''}`;
  }
}

function appendAmpStoryCssLink(host, head) {
  const ampStoryCssLink = createElement('link', {
    'rel': 'stylesheet',
    'amp-extension': 'amp-story',
    'href': `${host}/v0/amp-story-1.0.css`,
  });
  appendChild(head, ampStoryCssLink);
}

function appendAmpStoryDvhPolyfillScript(head) {
  const ampStoryDvhPolyfillScript = createElement('script', {
    [AMP_STORY_DVH_POLYFILL_ATTR]: '',
  });
  insertText(ampStoryDvhPolyfillScript, AMP_STORY_DVH_POLYFILL_CONTENT);
}

function isAmpStoryGridLayer(node) {
  return node.tagName === 'amp-story-grid-layer';
}

function isAmpStoryScript(node) {
  return (
    node.tagName === 'script' && node.attribs && node.attribs['custom-element'] === 'amp-story'
  );
}

function isAmpStoryDvhPolyfillScript(node) {
  return node.tagName === 'script' && hasAttribute(node, AMP_STORY_DVH_POLYFILL_ATTR);
}

function isStyleAmpCustom(node) {
  return node.tagName === 'style' && hasAttribute(node, 'amp-custom');
}

/** @module AmpStoryCssTransformer */
module.exports = AmpStoryCssTransformer;
