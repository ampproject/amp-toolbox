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
    url: "https://fonts.googleapis.com/icon?family=Material+Icons",
  },
  {
    className: "icofont-",
    fontFamilies: ["IcoFont"],
  },
  {
    className: "octicon-",
    fontFamilies: ["Octicons"],
  },
  {
    className: "icn-",
    fontFamilies: ["icon"],
  },
  {
    className: "icon-",
    fontFamilies: ["icon", "icons", "icomoon"],
  },
];

/**
 * Checks if icon fonts are being used
 */
export class NoIconFontIsUsed extends Rule {
  run({ $ }: Context) {
    // check for known classnames
    const iconFontCandidates = ICON_FONT_IDENTIFIERS.filter((identifier) => {
      return $(`[class*=${identifier.className} i]`).length > 0;
    });

    if (iconFontCandidates.length === 0) {
      return this.pass();
    }

    // check for known external stylesheets
    const knownExternalStylesheets = ICON_FONT_IDENTIFIERS.filter(
      (identifier) => {
        if (identifier.hasOwnProperty("url") && identifier["url"]) {
          return (
            $(`link[rel='stylesheet'][href^='${identifier.url}']`).length > 0
          );
        }
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
