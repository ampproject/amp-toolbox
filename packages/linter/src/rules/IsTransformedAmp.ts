import { Context } from "../index";
import { Rule } from "../rule";

export class IsTransformedAmp extends Rule {
  run({ $ }: Context) {
    const isTransformed = $("html[transformed='self;v=1']").length > 0;
    return isTransformed ? this.pass() : this.warn("No transformed AMP found");
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/",
      title: "Page is transformed AMP",
      info: "",
    };
  }
}
