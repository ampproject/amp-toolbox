import { Context } from "../index";
import { Rule } from "../rule";
import { isTransformedAmp } from "../helper";

/**
 * Check if the AMP Optimizer removed the AMP Boilerplate.
 */
export class BoilerplateIsRemoved extends Rule {
  run({ $ }: Context) {
    if (!isTransformedAmp($)) {
      // this check is only relevant for transformed amp pages
      return this.pass();
    }
    const boilerplate = $("html[i-amphtml-no-boilerplate]");
    if (boilerplate.length > 0) {
      // The desired result: boilerplate is removed
      return this.pass();
    }
    const fixedBlockingElements = $(
      "script[custom-element='amp-story'],script[custom-element='amp-audio']"
    );
    if (fixedBlockingElements.length > 0) {
      // with these elements the boilerplate cannot be removed and there are no options
      return this.pass();
    }
    const optionalBlockingElements = $(
      "script[custom-element='amp-experiment'],script[custom-element='amp-dynamic-css-styles']"
    );
    if (optionalBlockingElements.length > 0) {
      return this.info(
        "Avoid amp-experiment and amp-dynamic-css-styles if possible to allow AMP Boilerplate removal"
      );
    }
    return this.warn(
      "AMP Boilerplate not removed. Please upgrade to the latest AMP Optimizer version"
    );
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/",
      title: "AMP Boilerplate is removed",
      info: "",
    };
  }
}
