const fontfaceSrcParser = require('css-font-face-src');

/**
 * Extracts the best fontface URL for preloading (woff2 > woff > ?).
 *
 * @param {string} fontfaceSrc
 * @param {string} origin
 * @return {string}
 */
function parseFontfaceSrc(fontfaceSrc, origin) {
  let result = '';
  if (!fontfaceSrc) {
    return result;
  }
  const srcs = fontfaceSrcParser.parse(fontfaceSrc);
  for (const src of srcs) {
    if (src.url && src.format === 'woff2') {
      result = src.url;
      break;
    } else if (src.url && src.format === 'woff') {
      result = src.url;
    } else if (src.url && !result) {
      result = src.url;
    }
  }
  if (!result) {
    return result;
  }
  try {
    return new URL(result, origin).toString();
  } catch (e) {
    // invalid URL
    return '';
  }
}

module.exports = parseFontfaceSrc;
