
import { Context } from "../index";
import { Rule } from "../rule";

export class ImagesHaveAltText extends Rule {
  run({ $ }: Context) {
    let containsAltText = true;
    let imgsWithoutAlt = "";

    $('amp-img').each(function (i, elem) {
      if(!(elem.attribs.alt)) {
        containsAltText = false;
        imgsWithoutAlt = imgsWithoutAlt + "- " + elem.attribs.src + "\n";
      }

    });

    return !containsAltText
      ? this.warn(`Missing alt text from images: \n` + imgsWithoutAlt)
      : this.pass();
  }
  meta() {
    return {
      url:
        "https://html.spec.whatwg.org/multipage/parsing.html#determining-the-character-encoding",
      title: "Images contain alt text",
      info: "",
    };
  }
}