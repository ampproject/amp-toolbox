import { Context, Result } from "../index";
import { Rule } from "../rule";
import { notPass } from "../filter";

export class AmpImgAmpPixelPreferred extends Rule {
  async run(context: Context) {
    const $ = context.$;
    return (
      await Promise.all(
        $("amp-img[width=1][height=1]")
          .map((_, e) => {
            const layout = $(e).attr("layout");
            if (layout === "responsive") {
              // see comment at AmpImgHeightWidthIsOk
              return this.pass();
            }
            const s = $(e).toString();
            return this.warn(
              `[${s}] has width=1, height=1; <amp-pixel> may be a better choice`
            );
          })
          .get() as Array<Promise<Result>>
      )
    ).filter(notPass);
  }
  meta() {
    return {
      url: "",
      title: "1x1 images are specified by <amp-pixel>",
      info: "",
    };
  }
}
