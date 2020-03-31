import { Context } from "../index";
import { Rule } from "../rule";

export class StoryIsMostlyText extends Rule {
  run({ $ }: Context) {
    const text = $("amp-story").text();
    if (text.length > 100) {
      return this.pass();
    } else {
      return this.warn(`minimal text in the story [${text}]`);
    }
  }
  meta() {
    return {
      url: "",
      title: "Text is HTML (and not embedded into video)",
      info: "",
    };
  }
}
