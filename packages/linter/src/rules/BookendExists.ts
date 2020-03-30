import { Context } from "../index";
import { Rule } from "../rule";

export class BookendExists extends Rule {
  run(context: Context) {
    const { $ } = context;
    const s1 = $("amp-story amp-story-bookend").length === 1;
    const s2 = $("amp-story").attr("bookend-config-src");
    const bookendSrc = s1 || s2;
    return bookendSrc
      ? this.pass()
      : this.warn("<amp-story-bookend> not found");
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/components/amp-story/#bookend:-amp-story-bookend",
      title: "A bookend exists",
      info: "",
    };
  }
}
