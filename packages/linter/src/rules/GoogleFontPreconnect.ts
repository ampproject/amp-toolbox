import { Context } from "../index";
import { Rule } from "../rule";

/**
 * This rule tests if the page contains a dns-prefetch and preconnect for
 * fonts.gstatic.com when Google Fonts are used.
 */
export class GoogleFontPreconnect extends Rule {
  run({ $ }: Context) {
    const fonts = $(
      "link[rel='stylesheet'][href^='https://fonts.googleapis.com/css']"
    );
    if (!fonts.length) {
      return this.pass();
    }
    const preconnect = $(
      "link[href*='//fonts.gstatic.com'][rel~='preconnect'][crossorigin]"
    );
    const dnsPrefetch = $(
      "link[href*='//fonts.gstatic.com'][rel~='dns-prefetch']"
    );
    if (!preconnect.length || !dnsPrefetch.length) {
      return this.warn(
        `Preconnect Google Fonts using <link href=https://fonts.gstatic.com rel="dns-prefetch preconnect" crossorigin>`
      );
    }
    return this.pass();
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/optimize_amp/#optimize-the-amp-runtime-loading",
      title: "Preconnecting Google Fonts",
      info: "",
    };
  }
}
