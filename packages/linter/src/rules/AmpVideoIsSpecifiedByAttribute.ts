import { Context } from "../index";
import { Rule } from "../rule";

export class AmpVideoIsSpecifiedByAttribute extends Rule {
  run({ $ }: Context) {
    if ($("amp-video[src]").length > 0) {
      return this.warn(
        "<amp-video src> used instead of <amp-video><source/></amp-video>"
      );
    } else {
      return this.pass();
    }
  }
  meta() {
    return {
      url: "",
      title: "<amp-video><source/></amp-video> syntax is used for video",
      info: "",
    };
  }
}
