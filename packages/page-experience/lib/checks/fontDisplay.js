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

// Copy of https://github.com/ampproject/amp-toolbox/blob/main/packages/linter/src/rules/NoIconFontIsUsed.ts#L9
const ICON_FONTS = [
  'FontAwesome',
  'Font Awesome',
  'NerdFontsSymbols',
  'Nerd Font',
  'Material Icons',
  'IcoFont',
  'icon',
  'icons',
  'icomoon',
  'Dashicons',
  'Genericons',
];

/**
 * Checks whether a page uses the optimal font loading strategy for AMP pages. The recommemdation is to
 * use `font-display: optional` for critical fonts used in the first viewport. This improves LCP on slow
 * connections and avoids content-shifts resulting from font swapping.
 *
 * @param {Object} pageData
 */
const checkDisplayOptional = (pageData, result) => {
  const items = [];
  for (const font of pageData.criticalFonts) {
    const fontface = pageData.fontFaces.get(font);
    if (!fontface) {
      continue;
    }
    const isGoogleFont =
      fontface.mainSrc && fontface.mainSrc.startsWith('https://fonts.gstatic.com');
    const isIconFont = ICON_FONTS.some((font) => {
      return fontface['fontFamily'].includes(font);
    });
    if (isIconFont) {
      // warn to avoid icon fonts instead
      continue;
    }
    if (!fontface.fontDisplay) {
      items.push({
        font,
        fix: isGoogleFont
          ? 'Add `&display=optional` to your Google Font import declaration. [Read more](https://web.dev/font-display/#google-fonts).'
          : 'Add `font-display: optional`',
      });
    } else if (fontface.fontDisplay !== 'optional') {
      // TODO: only show this warning if CLS > 0
      items.push({
        font,
        fix: isGoogleFont
          ? `Add \`&display=optional\` to your Google Font import declaration. [Read more](https://web.dev/font-display/#google-fonts).',`
          : `Replace \`font-display: ${fontface.fontDisplay}\` with \`font-display: optional\``,
      });
    }
  }
  if (items.length === 0) {
    return;
  }
  result.warn({
    title: 'Improve LCP and CLS using `font-display: optional`',
    url: 'https://web.dev/optimize-webfont-loading/',
    message: `Load the critical webfonts using \`font-display: optional\` to improve LCP on slow connections and avoid content shifts.`,
  });
  result.addDetails({
    headings: [
      {label: 'Font', valueType: 'text', key: 'font'},
      {key: 'fix', valueType: 'text', label: 'Suggestion'},
    ],
    items,
  });
};

module.exports = checkDisplayOptional;
