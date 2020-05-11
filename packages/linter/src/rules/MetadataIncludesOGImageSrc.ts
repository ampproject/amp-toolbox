import { Context } from "../index";
import { Rule } from "../rule";

export class MetadataIncludesOGImageSrc extends Rule {
  run({ $ }: Context) {
    let hasOGImage = false;

    $("meta").each(function (i, elem) {
      if (
        elem.attribs.property &&
        elem.attribs.property.includes("og:image", 0) &&
        elem.attribs.content
      ) {
        hasOGImage = true;
        return false; 
      }
    });

    return !hasOGImage
      ? this.warn(`Missing og:image property or content source`)
      : this.pass();
  }
  meta() {
    return {
      url: "https://ogp.me/",
      title: "Metadata includes og:image and src",
      info: "",
    };
  }
}
