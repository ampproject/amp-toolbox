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
 * Checks whether a page uses the optimal font loading strategy for AMP pages. The recommemdation is to
 * use `font-display: optional` for critical fonts used in the first viewport. This improves LCP on slow
 * connections and avoids content-shifts resulting from font swapping.
 *
 * @param {Object} pageData
 */
const checkDisplayOptional = (pageData, result) => {
  for (const font of pageData.criticalFonts) {
    const fontface = pageData.fontFaces.get(font);
    if (!fontface) {
      continue;
    }

    if (!fontface.fontDisplay) {
      result.warn({
        title: 'Improve LCP using `font-display: optional`',
        url: 'https://web.dev/optimize-webfont-loading/',
        message: `Load the critical webfont '${font}' using \`font-display: optional\` to improve LCP on slow connections and avoid content shifts. ${maybeAddGoogleFontsTip(
          fontface
        )}`,
        info: {
          font,
          fontDisplay: font.fontDisplay,
        },
      });
    } else if (fontface.fontDisplay !== 'optional') {
      // TODO: only show this warning if CLS > 0
      result.warn({
        title: 'Avoid content shift caused by font swapping',
        url: 'https://web.dev/preload-optional-fonts/',
        message: `Consider loading the critical webfont '${font}' using \`font-display: optional\` instead of \`font-display: ${
          fontface.fontDisplay
        }\`. This can avoid content shifts on page load caused by font swapping. ${maybeAddGoogleFontsTip(
          fontface
        )}`,
        info: {
          font,
          fontDisplay: fontface.fontDisplay,
        },
      });
    }
  }
};

function maybeAddGoogleFontsTip(fontface) {
  const isGoogleFont = fontface.mainSrc && fontface.mainSrc.startsWith('https://fonts.gstatic.com');
  if (!isGoogleFont) {
    return '';
  }
  return 'Add the `&display=optional` parameter to the end of your Google Fonts URL to enable ([read more](https://web.dev/font-display/#google-fonts)).';
}

module.exports = checkDisplayOptional;
