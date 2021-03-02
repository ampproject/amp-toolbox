import { Context } from "../index";
import { Rule } from "../rule";

const postcss = require("postcss");
const safeParser = require("postcss-safe-parser");

const ICON_FONT_IDENTIFIERS = {
  classNames: [
    "fa-",
    "nf-",
    "material-icons",
    "icofont-",
    "icn-",
    "icon-",
    "icn",
    "icon",
  ],
  fontFamilies: [
    "FontAwesome",
    "Font Awesome",
    "NerdFontsSymbols",
    "Nerd Font",
    "Material Icons",
    "IcoFont",
    "icon",
    "icons",
    "icomoon",
  ],
  urls: ["https://fonts.googleapis.com/icon?family=Material+Icons"],
};

/**
 * Checks if icon fonts are being used
 */
export class NoIconFontIsUsed extends Rule {
  run({ $ }: Context) {
    // check for known classnames
    const iconFontCandidates = ICON_FONT_IDENTIFIERS.classNames.filter(
      (className) => {
        return $(`[class*=${className} i]`).length > 0;
      }
    );

    if (iconFontCandidates.length === 0) {
      return this.pass();
    }

    // check for known external stylesheets
    const knownExternalStylesheets = ICON_FONT_IDENTIFIERS.urls.filter(
      (url) => {
        return $(`link[rel='stylesheet'][href^='${url}']`).length > 0;
      }
    );

    if (knownExternalStylesheets.length) {
      return this.warn(
        "Avoid using icon fonts to improve loading speed and accessibility"
      );
    }

    // check for known font-families in documents custom styles
    const stylesText = $("style[amp-custom]").html();

    if (!stylesText) {
      return this.pass();
    }

    const iconFontMatches = [];

    const isIconFontDeclaration = (value) => {
      for (const fontFamily of ICON_FONT_IDENTIFIERS.fontFamilies) {
        if (value.match(fontFamily)) {
          return true;
        }
      }
      return false;
    };

    const iconFontPlugin = () => {
      return {
        postcssPlugin: "postcss-icon-font-is-used-2",
        Once(root) {
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
        },
      };
    };

    iconFontPlugin.postcss = true;

    postcss([iconFontPlugin])
      .process(stylesText, {
        from: undefined,
        parser: safeParser,
      })
      .catch((err) => {
        console.warn(`Failed to process CSS`, err.message);
        return { css: stylesText };
      });

    if (iconFontMatches.length > 0) {
      return this.warn(
        "Avoid using icon fonts to improve loading speed and accessibility"
      );
    }

    return this.pass();
  }
  meta() {
    return {
      url: "",
      title: "Page seems to use icon fonts",
      info: "",
    };
  }
}
