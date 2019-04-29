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
}
