import { Context } from "../index";
import { Rule } from "../rule";
import chalk from "chalk";

export class TitleMeetsLengthCriteria extends Rule {
  run({ $ }: Context) {
    const e = $("amp-story[title]");
    const PASSING_LEN = 90;

    return (e[0] as cheerio.TagElement).attribs.title.length > PASSING_LEN
      ? this.warn("Title is too long")
      : this.pass();
  }
  meta() {
    return {
      url:
        "https://developers.google.com/search/docs/guides/web-stories-creation-best-practices#seo",
      title: "Title is ninety characters or less",
      info: "",
    };
  }
}
