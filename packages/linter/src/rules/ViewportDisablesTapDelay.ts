import { Context } from "../index";
import { Rule } from "../rule";

export class ViewportDisablesTapDelay extends Rule {
  run({ $ }: Context) {
    const viewport = $("meta[name=viewport]")[0];
    if (!viewport) {
      return this.pass();
    }
    return viewport.attribs.content !== "width=device-width"
      ? this.fail(`Viewport width not set to device width`)
      : this.pass();
  }
  meta() {
    return {
      url:
        "https://developers.google.com/web/updates/2013/12/300ms-tap-delay-gone-away",
      title:
        "Set viewport width to the same as the device to disable touch delay causing FID.",
      info: "",
    };
  }
}
