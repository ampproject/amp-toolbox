import { Context } from "../index";
import { Rule } from "../rule";

export class MetadataIncludesOGImageSrc extends Rule {
  run({ $ }: Context) {

    let hasOGImage = false;

    $('meta').each(function (i, elem) {
      if(elem.attribs.property === 'og:image' && elem.attribs.content) {
        hasOGImage = true;
        return false;             //break the loop
      }
    });
    

    return !(hasOGImage)
      ? this.warn(`Missing og:image property or content source`)
      : this.pass();
  }
  meta() {
    return {
      url:
        "https://html.spec.whatwg.org/multipage/parsing.html#determining-the-character-encoding",
      title: "Metadata includes og:image and src",
      info: "",
    };
  }
}

