import { Context } from "../index";
import { Rule } from "../rule";
import chalk from "chalk";

export class TitleMeetsLengthCriteria extends Rule {
  run({ $ }: Context) {
    const e = $("amp-story[title]");

    return e[0].attribs.title.length > 40
      ? this.warn("Title is too long")
      : this.pass();
  }
  meta() {
    return {
      url: "https://blog.amp.dev/2020/02/12/seo-for-amp-stories/",
      title: "Title is forty characters or less",
      info: "",
    };
  }
}
