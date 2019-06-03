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
}
