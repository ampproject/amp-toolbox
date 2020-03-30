import { Context } from "../index";
import { Rule } from "../rule";

export class MetaCharsetIsFirst extends Rule {
  run({ $ }: Context) {
    const firstChild = $("head *:first-child");
    const charset = firstChild.attr("charset");
    return !charset
      ? this.fail(`<meta charset> not the first <meta> tag`)
      : this.pass();
  }
  meta() {
    return {
      url:
        "https://html.spec.whatwg.org/multipage/parsing.html#determining-the-character-encoding",
      title: "<meta charset> is the first <meta> tag",
      info: "",
    };
  }
}
