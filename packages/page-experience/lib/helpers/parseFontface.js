const postcss = require('postcss');
const safeParser = require('postcss-safe-parser');
const parseFontfaceSrc = require('./parseFontfaceSrc');

/**
 * Parses a CSS string for all fontface definitions.
 *
 * @param {string} styles
 * @param {string} origin the origin URL
 * @return {Map<string, Object>} a mapping from font name to fontface definition.
 */
function parseFontfaces(styles, origin) {
  let fontFaces = new Map();

  const fontfacePlugin = () => {
    return {
      postcssPlugin: 'postcss-extract-fontface',
      Once(root) {
        root.nodes.forEach((rule) => {
          if (rule.name === 'font-face') {
            const fontFace = {};
            for (const declaration of rule.nodes) {
              if (declaration.prop === 'font-family') {
                fontFace.fontFamily = declaration.value.replace(/["']/g, '');
              } else if (declaration.prop === 'font-display') {
                fontFace.fontDisplay = declaration.value;
              } else if (declaration.prop === 'src') {
                fontFace.src = declaration.value;
                fontFace.mainSrc = parseFontfaceSrc(fontFace.src, origin);
              }
            }
            fontFaces.set(fontFace.fontFamily, fontFace);
          }
        });
      },
    };
  };

  fontfacePlugin.postcss = true;
  postcss([fontfacePlugin])
    .process(styles, {
      from: undefined,
      parser: safeParser,
    })
    .catch((err) => {
      console.warn(`Failed to process CSS`, err);
      return {css: styles};
    });
  return fontFaces;
}

module.exports = parseFontfaces;
