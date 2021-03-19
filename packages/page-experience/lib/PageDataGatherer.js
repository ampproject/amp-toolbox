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
const treeKill = require('tree-kill');
const parseFontfaces = require('./helpers/parseFontface');

// Pixel 5 XL
const DEFAULT_VIEWPORT = {
  width: 393,
  height: 851,
  isMobile: true,
  hasTouch: true,
};

/**
 * Renders a page in Puppeteer and collects all data required for the page experience recommendations.
 */
class PageAnalyzer {
  /**
   * @param config optional configuration
   * @param config.debug enable debug output, default false
   * @param config.viewport the viewport size, default Pixel 5XL
   */
  constructor(config = {}) {
    this.viewport = config.viewport || DEFAULT_VIEWPORT;
    this.debug = config.debug || false;
    this.started = false;
  }

  /**
   * Start puppeteer
   */
  async start() {
    this.browser = await puppeteer.launch({
      viewport: this.viewport,
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
    const {page, remoteStyles} = await this.setupPage();
    const response = await page.goto(url, {waitUntil: 'load'});

    const html = await response.text();
    return await this.gatherPageData(page, {remoteStyles, html, headers: response.headers()});
  }

  /**
   * Shutdown Puppeteer.
   */
  async shutdown() {
    try {
      await this.browser.close();
    } finally {
      treeKill(this.browser.process().pid, 'SIGKILL');
      this.started = false;
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
       * Returns true if the given element is in the first viewport.
       *
       * @param {Element} el
       * @return {boolean}
       */
      const isElementInViewport = (el) => {
        const rect = el.getBoundingClientRect();
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
       * Returns a bool that reflects if a transformed page is using
       * the module version of the AMP runtime
       *
       * @return {Array<string>}
       */
      const collectTransformedRuntimeUse = () => {
        const IS_TRANSFORMED = document.querySelectorAll('html[transformed]');
        const RUNTIME_MODULE = document.querySelectorAll('script[src$="v0.mjs"]');

        if (!IS_TRANSFORMED) {
          return null
        }

        return RUNTIME_MODULE.length > 0
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
          if (isElementInViewport(node)) {
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

      return {
        url: window.location.href,
        origin: window.location.origin,
        fontPreloads: collectFontPreloads(),
        localStyles: collectInlineStyles(),
        usingModuleVersion: collectTransformedRuntimeUse(),
        ...collectFontsUsedOnPage(),
      };
    });

    return {
      criticalFonts: result.criticalFonts,
      nonCriticalFonts: result.nonCriticalFonts,
      usingModuleVersion: result.usingModuleVersion,
      fontFaces: parseFontfaces([...remoteStyles, ...result.localStyles].join('\n'), result.origin),
      fontPreloads: result.fontPreloads,
      headers,
      html,
      remoteStyles: remoteStyles,
      url: result.url,
    };
  }

  /**
   * @private
   */
  async setupPage() {
    const page = await this.browser.newPage();
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
        // Only donwload AMP runtime scripts as they're need for layouting the page
        // Once self-hosting is a thing we'll have to change this
        // TODO: investigate whether we could cache these locally
        return request.abort();
      }
      return request.continue();
    });

    // Collect external stylesheets from requests as we can't read them otherwise due to CORS
    page.on('response', async (response) => {
      if (response.request().resourceType() === 'stylesheet') {
        remoteStyles.push(await response.text());
      }
    });
    return {
      page,
      remoteStyles,
    };
  }
}

module.exports = PageAnalyzer;
