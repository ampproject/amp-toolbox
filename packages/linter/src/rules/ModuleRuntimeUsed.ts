import { Context } from "../index";
import { Rule } from "../rule";

export class ModuleRuntimeUsed extends Rule {
  run({ $ }: Context) {
    const isTransformed = $("html[transformed='self;v=1']").length > 0;
    if (!isTransformed) {
      return this.pass();
    }
    const isModuleVersion =
      $("script[type='module'][src='https://cdn.ampproject.org/v0.mjs']")
        .length > 0;
    return isModuleVersion
      ? this.pass()
      : this.warn(
          "The Java Script module version of the AMP Runtime is not used"
        );
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/",
      title: "Page is using Java Script Module version of the AMP Runtime",
      info: "",
    };
  }
}
