import { Context } from "../index";
import { Rule } from "../rule";

const postcss = require("postcss");
const safeParser = require("postcss-safe-parser");

const ICON_FONT_IDENTIFIERS = [
  {
    className: "fa-",
    fontFamilies: ["FontAwesome", "Font Awesome"],
  },
  {
    className: "nf-",
    fontFamilies: ["NerdFontsSymbols", "Nerd Font"],
  },
  {
    className: "material-icons",
    fontFamilies: ["Material Icons"],
  },
  {
    className: "icofont-",
    fontFamilies: ["IcoFont"],
  },
  {
    className: "ociton-",
    fontFamilies: ["Octicons"],
  },
];

/**
 * Checks if icon fonts are being used
 */
export class NoIconFontIsUsed extends Rule {
  async run({ $ }: Context) {
    // grab all elements responding to classnames from ICON_FONT_IDENTIFIERS list
    const iconFontCandidates = ICON_FONT_IDENTIFIERS.filter((identifier) => {
      return $(`[class*=${identifier.className}]`).length > 0;
    });

    // grab the amp-custom css
    const stylesText = $("style[amp-custom]").html();

    if (iconFontCandidates.length === 0 && !stylesText) {
      return this.pass();
    }

    const iconFontMatches = [];

    const isIconFontDeclaration = (value) => {
      for (const { fontFamilies } of iconFontCandidates) {
        for (const fontFamily of fontFamilies) {
          if (value.match(fontFamily)) {
            return true;
          }
        }
      }
      return false;
    };

    const iconFontPlugin = postcss.plugin("postcss-icon-font-is-used", () => {
      return (root) => {
        root.nodes.forEach((rule) => {
          if (rule.name === "font-face") {
            for (const declaration of rule.nodes) {
              if (declaration.prop === "font-family") {
                // check if font-family matches candidate list
                const match = isIconFontDeclaration(declaration.value);
                if (match) {
                  iconFontMatches.push(declaration);
                }
              }
            }
          }
        });
      };
    });

    await postcss([iconFontPlugin])
      .process(stylesText, {
        from: undefined,
        parser: safeParser,
      })
      .catch((err) => {
        console.warn(`Failed to process CSS`, err.message);
        return { css: stylesText };
      });

    if (iconFontMatches.length > 0) {
      return this.fail("It seems like icon fonts are being used on this page.");
    }

    if (iconFontMatches.length === 0 && iconFontCandidates.length > 0) {
      return this.warn("Suspicious icon font class names detected.");
    }
  }
}
