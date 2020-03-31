import { absoluteUrl, contentLength } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";

export class AmpVideoIsSmall extends Rule {
  async run(context: Context) {
    const { $ } = context;
    const args = await Promise.all(
      ($(`amp-video source[type="video/mp4"][src], amp-video[src]`)
        .map(async (i, e) => {
          const url = absoluteUrl($(e).attr("src"), context.url);
          try {
            const length = await contentLength(context, url!);
            return { url, length };
          } catch (e) {
            // URL is non-2xx (TODO: improve error handling)
            return { url, length: -1 };
          }
        })
        .get() as unknown) as Array<
        Promise<{
          url: string;
          length: number;
        }>
      >
    );
    const videos = args.reduce(
      (a, v) => {
        a[v.url] = v.length;
        return a;
      },
      {} as {
        [url_1: string]: number;
      }
    );
    if (args.length === 0) {
      return [];
    }
    // Over 4MB is too big: https://amp.dev/documentation/guides-and-tutorials/develop/amp_story_best_practices#size/length-of-video
    const large = Object.keys(videos).filter((v) => videos[v] > 4000000);
    if (large.length > 0) {
      return this.fail(`videos over 4MB: [${large.join(",")}]`);
    } else {
      return this.pass(`[${Object.keys(videos).join(",")}] are all under 4MB`);
    }
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/develop/amp_story_best_practices#size/length-of-video",
      title: "Videos are under 4MB",
      info: "",
    };
  }
}
