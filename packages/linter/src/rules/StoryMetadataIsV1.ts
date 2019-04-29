import { Context } from "../index";
import { Rule } from "../rule";

export class StoryMetadataIsV1 extends Rule {
  run({ $ }: Context) {
    const isV1 =
      $("script[src='https://cdn.ampproject.org/v0/amp-story-1.0.js']").length >
      0;
    if (!isV1) {
      return this.pass();
    }
    const attr: string[] = [
      "title",
      "publisher",
      "publisher-logo-src",
      "poster-portrait-src"
    ]
      .map(a => ($(`amp-story[${a}]`).length > 0 ? false : a))
      .filter(Boolean) as string[];
    if (attr.length > 0) {
      return this.warn(
        `<amp-story> is missing attribute(s) that will soon be mandatory: [${attr.join(
          ", "
        )}]`
      );
    } else {
      return this.pass();
    }
  }
}
