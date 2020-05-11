import { Context } from "../index";
import { Rule } from "../rule";

export class ImagesHaveAltText extends Rule {
  run({ $ }: Context) {
    let imgsWithoutAlt = "";

    $("amp-img").each(function (i, elem) {
      if (!elem.attribs.alt) {
        imgsWithoutAlt = imgsWithoutAlt + "- " + elem.attribs.src + "\n";
      }
    });

    return imgsWithoutAlt.length > 0
      ? this.warn(`Missing alt text from images: \n` + imgsWithoutAlt)
      : this.pass();
  }
  meta() {
    return {
      url: "https://blog.amp.dev/2020/02/12/seo-for-amp-stories/",
      title: "Images contain alt text",
      info: "",
    };
  }
}
