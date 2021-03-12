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

/**
 * Checks if critical fonts are preloaded.
 *
 * @param {Object} pageData
 */
const checkPreloads = (pageData, result) => {
  for (const font of pageData.criticalFonts) {
    const fontface = pageData.fontFaces.get(font);
    if (!fontface || !fontface.mainSrc) {
      continue;
    }
    if (!pageData.fontPreloads.includes(fontface.mainSrc)) {
      if (fontface.mainSrc.startsWith('https://fonts.gstatic.com')) {
        result.warn({
          title: 'Self-host Google Fonts',
          url: 'https://www.tunetheweb.com/blog/should-you-self-host-google-fonts/',
          message: `Consider self-hosting and preloading '${font}'. The font is used in the first viewport and self-hosting Google Fonts can improve LCP times. Important: run a few tests first, because if you are not using a CDN or your server response times are slow, this might not have a positive impact.`,
          info: '',
        });
      } else {
        result.fail({
          title: 'Preload critical fonts',
          url: 'https://web.dev/codelab-preload-web-fonts/',
          message: `Critical font '${font}' is not preloaded. Add \`<link rel="preload" href="${fontface.mainSrc}" as="font" crossorigin>\` to your \`<head>\`.`,
          info: '',
        });
      }
    }
  }
  for (const font of pageData.nonCriticalFonts) {
    const fontface = pageData.fontFaces.get(font);
    if (!fontface || !fontface.mainSrc) {
      continue;
    }
    if (pageData.fontPreloads.includes(fontface.mainSrc)) {
      // TODO: investigate how we can avoid only optimizing for mobile
      result.fail({
        title: 'Preload only critical fonts',
        url: 'https://web.dev/optimize-webfont-loading/#preload-your-webfont-resources',
        message: `Avoid preloading non-critical font '${fontface.mainSrc}' as it is not used in the first viewport.`,
        info: '',
      });
    }
  }
};

module.exports = checkPreloads;
