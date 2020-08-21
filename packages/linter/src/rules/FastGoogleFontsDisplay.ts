import { Context } from "../index";
import { Rule } from "../rule";

const GOOGLE_FONT_URL_PATTERN = /https?:\/\/fonts.googleapis.com\/css\?(?!(?:[\s\S]+&)?display=(?:swap|fallback|optional)(?:&|$))/i;

/**
 * This test will return an info when font-face definitions with a url
 * but no fonts are preloaded.
 * Font definitions with url but an additional font-display setting are ignored.
 */
export class FastGoogleFontsDisplay extends Rule {
  run({ $ }: Context) {
    const fonts = $(
      "link[rel='stylesheet'][href^='https://fonts.googleapis.com/css']"
    );
    if (!fonts.length) {
      return this.pass();
    }
    const results = [];
    fonts.each((i, linkNode) => {
      const href = $(linkNode).attr("href");
      const match = GOOGLE_FONT_URL_PATTERN.exec(href);
      if (match) {
        results.push(
          this.warn(
            `Use &display=swap|fallback|optional in Google Font stylesheet URL: ${href}`
          )
        );
      }
    });
    return Promise.all(results);
  }
  meta() {
    return {
      url: "https://web.dev/font-display/",
      title: "Use fast font-display for Google Fonts",
      info: "",
    };
  }
}
