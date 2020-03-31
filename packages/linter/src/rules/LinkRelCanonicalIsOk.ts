import { absoluteUrl, redirectUrl } from "../helper";
import { Context, LintMode } from "../index";
import { Rule } from "../rule";

export class LinkRelCanonicalIsOk extends Rule {
  async run(context: Context) {
    const { $, url, mode } = context;
    if (mode !== LintMode.AmpStory) {
      return this.pass();
    }
    const canonical = $('link[rel="canonical"]').attr("href");
    if (!canonical) {
      return this.fail("<link rel=canonical> not specified");
    }
    const s1 = absoluteUrl(canonical, url);
    // does canonical match url?
    if (url !== s1) {
      return this.fail(`actual: ${s1}, expected: ${url}`);
    }
    // does url redirect?
    try {
      const s2 = await redirectUrl(context, url);
      if (s2 === url) {
        return this.pass();
      } else {
        return this.fail(`actual: ${s2}, expected: ${url}`);
      }
    } catch (e) {
      return this.fail(`couldn't retrieve canonical ${url}`);
    }
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/discovery/#what-if-i-only-have-one-page?",
      title: "Story is self-canonical",
      info: "",
    };
  }
}
