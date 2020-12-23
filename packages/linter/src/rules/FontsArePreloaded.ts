import { Context } from "../index";
import { Rule } from "../rule";

const FONT_FACE_URL_PATTERN = /@font-face\s*\{(?![^}]*font-display)[^}]*\burl\s*\(/i;

/**
 * This test will return an info when font-face definitions with a url
 * but no fonts are preloaded.
 * Font definitions with url but an additional font-display setting are ignored.
 */
export class FontsArePreloaded extends Rule {
  run({ $ }: Context) {
    const css = $("style[amp-custom]").html();
    if (!css || !FONT_FACE_URL_PATTERN.test(css)) {
      return this.pass();
    }
    const preloadedFonts = $("link[rel='preload'],[as='font']").length;
    if (preloadedFonts === 0) {
      return this.info(
        "Web fonts are used without preloading. Preload them if they are used in the first viewport."
      );
    }
    return this.pass();
  }
  meta() {
    return {
      url: "https://web.dev/codelab-preload-web-fonts/",
      title: "Web fonts are preloaded",
      info: "",
    };
  }
}
