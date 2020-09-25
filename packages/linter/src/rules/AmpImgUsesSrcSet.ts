import { Context } from "../index";
import { Rule } from "../rule";

const SVG_URL_PATTERN = /^[^?]+\.svg(\?.*)?$/i

const CHECKED_IMG_LAYOUTS = ["fill", "flex-item", "intrinsic", "responsive"];

export class AmpImgUsesSrcSet extends Rule {
  async run(context: Context) {
    const $ = context.$;

    const incorrectImages = $("amp-img")
        .filter((_, e) => {
          const src = $(e).attr("src");
          const layout = $(e).attr("layout");
          const srcset = $(e).attr("srcset");
          return (
            !SVG_URL_PATTERN.exec(src)
            && layout && CHECKED_IMG_LAYOUTS.includes(layout)
            && !srcset
          )
        });
    if (incorrectImages.length > 0) {
      return this.warn(
        "Not all <amp-img> with non-fixed layout define a srcset. Using AMP Optimizer might help."
      );
    }
    return this.pass();
  }
  meta() {
    return {
      url: "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/explainer/?format=websites#image-optimization",
      title: "<amp-img> with non-fixed layout uses srcset",
      info: "",
    };
  }
}
