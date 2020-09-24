import { Context } from "../index";
import { Rule } from "../rule";

const SVG_URL_PATTERN = /^[^?]+\.svg(\?.*)?$/i

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
            && layout && layout !== 'fixed' && layout != 'fixed-height'
            && !srcset
          )
        });
    if (incorrectImages.length > 0) {
      return this.warn(
        "Not all responsive <amp-img> define a srcset. Using AMP Optimizer might help."
      );
    }
    return this.pass();
  }
  meta() {
    return {
      url: "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/explainer/?format=websites#image-optimization",
      title: "Responsive <amp-img> uses srcset",
      info: "",
    };
  }
}
