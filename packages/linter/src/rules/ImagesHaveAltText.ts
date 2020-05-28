import { Context } from "../index";
import { Rule } from "../rule";
import chalk from "chalk";

export class ImagesHaveAltText extends Rule {
  run({ $ }: Context) {
    let imgsWithoutAlt: { [key: string]: number } = {};
    let output = "";

    const color = (s: string) => {
      return chalk.yellow(s);
    };

    $("amp-img").each(function (i, elem) {
      if (!elem.attribs.alt) {
        if (typeof imgsWithoutAlt[elem.attribs.src] == "undefined") {
          imgsWithoutAlt[elem.attribs.src] = 1;
        } else {
          imgsWithoutAlt[elem.attribs.src] += 1;
        }
      }
    });

    for (let key in imgsWithoutAlt) {
      imgsWithoutAlt[key] > 1
        ? (output += key + color(" [used " + imgsWithoutAlt[key] + " times]\n"))
        : (output += key + "\n");
    }

    return Object.keys(imgsWithoutAlt).length > 0
      ? this.warn("Missing alt text from images: \n" + output)
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
