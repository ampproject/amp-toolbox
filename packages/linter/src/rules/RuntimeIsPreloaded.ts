import { Context } from "../index";
import { Rule } from "../rule";

export class RuntimeIsPreloaded extends Rule {
  run({ $ }: Context) {
    const jsAttr = ["href$='/v0.js'", "rel='preload'", "as='script'"]
      .map((s) => `[${s}]`)
      .join("");
    const mjsAttr = ["href$='/v0.mjs'", "rel$='preload'"] // preload or modulepreload
      .map((s) => `[${s}]`)
      .join("");
    const isPreloaded = $(`link${jsAttr}, link${mjsAttr}`).length > 0;
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
