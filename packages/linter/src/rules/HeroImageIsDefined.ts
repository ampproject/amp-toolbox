import { Context } from "../index";
import { Rule } from "../rule";
import PreloadHeroImage from "@ampproject/toolbox-optimizer/lib/transformers/PreloadHeroImage";

/**
 * This rule checks if the document contains possible hero elements
 * but none is marked with 'data-hero'.
 * A hero element can be an amp-img and amp-iframe (with placeholder)
 * and a relevant size.
 */
export class HeroImageIsDefined extends Rule {
  run({ $ }: Context) {
    const hasHeroImage =
      $("amp-img[data-hero],amp-iframe[data-hero]").length > 0;
    const body = $("body");
    if (hasHeroImage || body.length === 0) {
      return this.pass();
    }
    const heroCandidates = new PreloadHeroImage({
      log: console,
    }).findHeroImages(body.get(0));
    if (heroCandidates.find((heroImage) => heroImage.ampImg)) {
      // The PreloadHeroImage transformer will also return amp-video posters
      // but they cannot be marked as 'data-hero' and will not have the 'ampImg'
      return this.warn("Use data-hero to mark hero images");
    }
    return this.pass();
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/explainer/?format=websites#hero-image-optimization",
      title: "Hero image is defined",
      info: "",
    };
  }
}
