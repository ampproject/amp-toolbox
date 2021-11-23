const {nextNode, firstChildByTag, setAttribute} = require('../NodeUtils');
const {skipNodeAndChildren} = require('../HtmlDomHelper');
const {isTemplate, AMP_CACHE_HOST} = require('../AmpConstants');
const {calculateHost} = require('../RuntimeHostHelper');
const {
  hasAttribute,
  remove,
  createElement,
  insertBefore,
  nextNode,
  firstChildByTag,
} = require('../NodeUtils');

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

    // If there is no amp-story in this document then we don't need to do
    // any transformations.
    if (!hasAmpStoryScriptNode(head)) return;

    const host = calculateHost(params);

    const ampStoryCssLink = createElement('link', {
      'rel': 'stylesheet',
      'amp-extension': 'amp-story',
      'href': `${host}/v0/amp-story-1.0.css`
    });
  }
}

function hasAmpStoryScriptNode(head) {
  for (let node = head.firstChild; node !== null; node = node.nextSibling) {
    if (node.tagName !== 'script') continue;
    if (!node.attribs) continue;
    if (node.attribs['custom-element'] !== 'amp-story') continue;
    return true;
  }
  return false;
}

/** @module AmpStoryCssTransformer */
module.exports = AmpStoryCssTransformer;
