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
  const items = [];
  for (const font of pageData.criticalFonts) {
    const fontface = pageData.fontFaces.get(font);
    if (!fontface || !fontface.mainSrc) {
      continue;
    }
    if (!pageData.fontPreloads.includes(fontface.mainSrc)) {
      if (!fontface.mainSrc.startsWith('https://fonts.gstatic.com')) {
        items.push({
          font,
          fix: `Add \`<link rel="preload" href="${fontface.mainSrc}" as="font" crossorigin>\` to your \`<head>\`.`,
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
      /*
      result.fail({
        title: 'Preload only critical fonts',
        url: 'https://web.dev/optimize-webfont-loading/#preload-your-webfont-resources',
        message: `Avoid preloading non-critical font '${fontface.mainSrc}' as it is not used in the first viewport.`,
        info: '',
      });
      */
    }
  }
  if (items.length === 0) {
    return;
  }
  result.warn({
    title: 'Preload critical fonts',
    url: 'https://web.dev/optimize-webfont-loading/',
    message:
      'Preload critical fonts to help the browser discover fonts used in the first viewport quicker.',
    details: {
      headings: [
        {label: 'Font', valueType: 'text', key: 'font'},
        {key: 'fix', valueType: 'text', label: 'Suggestion'},
      ],
    },
    items,
  });
};

module.exports = checkPreloads;
