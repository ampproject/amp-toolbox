import { Context } from "../index";
import { Rule } from "../rule";

export class StoryRuntimeIsV1 extends Rule {
  run({ $ }: Context) {
    const isV1 =
      $("script[src='https://cdn.ampproject.org/v0/amp-story-1.0.js']").length >
      0;
    return isV1
      ? this.pass()
      : this.fail("amp-story-1.0.js not used (probably 0.1?)");
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/components/amp-story/#migrating-from-0.1-to-1.0",
      title: "AMP Story v1.0 is used",
      info: "",
    };
  }
}
