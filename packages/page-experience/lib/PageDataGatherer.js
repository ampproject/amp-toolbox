/**
 * Copyright 2021  The AMP HTML Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const puppeteer = require('puppeteer');
const parseFontfaces = require('./helpers/parseFontface');

// Pixel 5 XL
const DEFAULT_DEVICE = 'Pixel 2 XL';

/**
 * Renders a page in Puppeteer and collects all data required for the page experience recommendations.
 */
class PageAnalyzer {
  /**
   * @param config optional configuration
   * @param config.debug enable debug output, default false
   * @param config.device the viewport size, default Pixel 2XL, see https://github.com/puppeteer/puppeteer/blob/main/src/common/DeviceDescriptors.ts for full list
   */
  constructor(config = {}) {
    this.device = puppeteer.KnownDevices[config.device || DEFAULT_DEVICE];
    if (!this.device) {
      throw new Error(`Unknown device "${config.device}"`);
    }
    this.debug = config.debug || false;
    this.started = false;
  }

  /**
   * Start puppeteer
   */
  async start() {
    this.browser = await puppeteer.launch({
      timeout: 10000,
    });
    this.started = true;
  }

  /**
   * Load a page in Puppeteer and collect data required by checks. Needs to be called after 'start'.
   *
   * @param {string} url the URL to analyze
   * @return {Object} all data collected on the page
   */
  async execute(url) {
    if (!this.started) {
      throw new Error('Puppeteer not running, please call `start` first.');
    }
    const {page, remoteStyles, responsePromise} = await this.setupPage();
    await page.goto(url, {waitUntil: 'load'});

    const response = await responsePromise;
    if (!response) {
      throw new Error('Failed loading url', url);
    }
    const {html, headers} = response;
    const data = await this.gatherPageData(page, {remoteStyles, html, headers});
    await page.close();
    return data;
  }

  /**
   * Shutdown Puppeteer.
   */
  async shutdown() {
    try {
      await this.browser.close();
      this.browser = null;
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * @private
   */
  async gatherPageData(page, globalData) {
    const {remoteStyles, html, headers} = globalData;
    const result = await page.evaluate(async () => {
      /* global document, window */

      /**
       * Returns true if the given element is visible
       *
       * @param {Element} elem
       * @return {boolean}
       */
      const isVisible = (elem) => {
        return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
      };

      /**
       * Returns true if the given element is visible and in the first viewport.
       *
       * @param {Element} elem
       * @return {boolean}
       */
      const isCriticalElement = (elem) => {
        if (!isVisible(elem)) {
          return false;
        }
        const rect = elem.getBoundingClientRect();
        return (
          rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
          rect.left <= (window.innerWidth || document.documentElement.clientWidth)
        );
      };

      /**
       * Returns a list of all inline `<style>` definitions.
       *
       * @return {Array<string>}
       */
      const collectInlineStyles = () => {
        const css = [];
        for (const style of document.querySelectorAll('style')) {
          css.push(style.innerText);
        }
        return css;
      };

      /**
       * Returns a list of all font preload hrefs. URLs are normalized to the current origin.
       *
       * @return {Array<string>} a list of URLs
       */
      const collectFontPreloads = () => {
        return Array.from(document.querySelectorAll('link[rel=preload][as=font]')).map(
          (preload) => {
            const href = preload.getAttribute('href');
            if (!href) {
              return null;
            }
            try {
              return new URL(href, window.location.origin).toString();
            } catch (e) {
              console.log('Preload is not an URL');
            }
          }
        );
      };

      /**
       * Returns the first font name in a font-family definition. Quotes etc are removed.
       *
       * @param {string} fontFamilyString
       * @return {string} the first font
       */
      const extractFirstFont = (fontFamilyString) => {
        if (!fontFamilyString) {
          return null;
        }
        const font = fontFamilyString.split(',')[0];
        return font.replace(/["']/g, '');
      };

      /**
       * Returns a list of critical and non-critical fonts. Critical fonts are used in the first viewport.
       * All other fonts are considered non-critical.
       *
       * TODO: take font-weights into account when calculating critical fonts.
       *
       * @return {Object}
       */
      const collectFontsUsedOnPage = () => {
        const criticalFonts = new Set();
        const nonCriticalFonts = new Set();
        document.querySelectorAll('body *').forEach((node) => {
          const computedStyles = window.getComputedStyle(node);
          const fontFamily = computedStyles.getPropertyValue('font-family');
          const font = extractFirstFont(fontFamily);
          if (!font) {
            return;
          }
          if (isCriticalElement(node)) {
            criticalFonts.add(font);
          } else {
            nonCriticalFonts.add(font);
          }
        });
        return {
          criticalFonts: Array.from(criticalFonts),
          // Make sure to remove later discovered critical fonts from the list of non-critical ones
          nonCriticalFonts: Array.from(nonCriticalFonts).filter((font) => !criticalFonts.has(font)),
        };
      };

      /**
       * Returns an array of URLs representing any iframe found in the initial viewport of a page
       *
       * @return {Array<string>}
       */
      const collectInitialIframes = () => {
        return [...document.querySelectorAll('amp-iframe')]
          .filter(isCriticalElement)
          .map((i) => i.getAttribute('src'));
      };

      /**
       * Returns an array of amp-img declarations representing any amp-img found in the initial viewport of a page
       *
       * @return {Array<Object>} object containing the image's src, layout, width and height values
       */
      const collectInitialAmpImg = () => {
        const ampImgs = document.querySelectorAll('amp-img');
        const result = [];
        for (const ampImg of ampImgs) {
          if (isCriticalElement(ampImg)) {
            result.push({
              src: ampImg.getAttribute('src'),
              dataHero: ampImg.hasAttribute('data-hero'),
              layout: ampImg.getAttribute('layout'),
              width: ampImg.getAttribute('width'),
              height: ampImg.getAttribute('height'),
            });
          }
        }
        return result;
      };

      return {
        url: window.location.href,
        origin: window.location.origin,
        fontPreloads: collectFontPreloads(),
        localStyles: collectInlineStyles(),
        criticalIframes: collectInitialIframes(),
        criticalAmpImg: collectInitialAmpImg(),
        ...collectFontsUsedOnPage(),
      };
    });

    return {
      criticalFonts: result.criticalFonts,
      criticalIframes: result.criticalIframes,
      criticalAmpImg: result.criticalAmpImg,
      nonCriticalFonts: result.nonCriticalFonts,
      fontFaces: parseFontfaces([...remoteStyles, ...result.localStyles].join('\n'), result.origin),
      fontPreloads: result.fontPreloads,
      headers,
      remoteStyles: remoteStyles,
      url: result.url,
      html,
    };
  }

  /**
   * @private
   */
  async setupPage() {
    const page = await this.browser.newPage();
    await page.emulate(this.device);
    const remoteStyles = [];
    if (this.debug) {
      page.on('console', (msg) => console.log('[PAGE LOG] ', msg.text()));
    }
    page.setRequestInterception(true);

    // Abort requests not needed for rendering the page
    page.on('request', (request) => {
      const requestTypeIgnoreList = new Set(['image', 'video']);
      if (requestTypeIgnoreList.has(request.resourceType())) {
        return request.abort();
      }
      if (
        request.resourceType() === 'script' &&
        !request.url().startsWith('https://cdn.ampproject.org')
      ) {
        // Only download AMP runtime scripts as they're need for layouting the page
        // Once self-hosting is a thing we'll have to change this
        // TODO: investigate whether we could cache these locally
        return request.abort();
      }
      return request.continue();
    });

    let responseCallback;
    const responsePromise = new Promise((resolve) => {
      responseCallback = resolve;
    });
    // Collect external stylesheets from requests as we can't read them otherwise due to CORS
    page.on('response', async (response) => {
      if (response.request().resourceType() === 'stylesheet') {
        if (response.ok()) {
          remoteStyles.push(await response.text());
        }
      } else if (response.request().resourceType() === 'document') {
        if (response.ok()) {
          responseCallback({
            html: await response.text(),
            headers: await response.headers(),
          });
        }
      }
    });
    return {
      page,
      responsePromise,
      remoteStyles,
    };
  }
}

module.exports = PageAnalyzer;
