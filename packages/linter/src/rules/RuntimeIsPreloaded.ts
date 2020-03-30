import { Context } from "../index";
import { Rule } from "../rule";

export class RuntimeIsPreloaded extends Rule {
  run({ $ }: Context) {
    const attr = [
      "href='https://cdn.ampproject.org/v0.js'",
      "rel='preload'",
      "as='script'",
    ]
      .map((s) => `[${s}]`)
      .join("");
    const isPreloaded = $(`link${attr}`).length > 0;
    return isPreloaded
      ? this.pass()
      : this.warn(
          "<link href=https://cdn.ampproject.org/v0.js rel=preload> is missing"
        );
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/optimize_amp/#optimize-the-amp-runtime-loading",
      title: "Runtime is preloaded",
      info: "",
    };
  }
}
