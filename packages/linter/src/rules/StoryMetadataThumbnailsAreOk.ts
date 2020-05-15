import { ImageSize } from "probe-image-size";
import { absoluteUrl, dimensions } from "../helper";
import { Context, Result, Metadata } from "../index";
import { Rule } from "../rule";
import { notPass } from "../filter";

function inlineMetadata($: CheerioStatic) {
  const e = $("amp-story");
  const metadata: Metadata = {
    "poster-landscape-src": e.attr("poster-landscape-src"), // optional
    "poster-portrait-src": e.attr("poster-portrait-src"),
    "poster-square-src": e.attr("poster-square-src"), // optional
    "publisher": e.attr("publisher"),
    "publisher-logo-src": e.attr("publisher-logo-src"),
    "title": e.attr("title"),
  };
  return metadata;
}
const outputMessageMap: { [key: string]: string } = {
  isPortrait: " a 3:4 aspect ratio",
  isSquare: " a 1:1 aspect ratio",
  isRaster: " of type .jpeg, .gif, .png, or .webp",
  isLandscape: " a 4:3 aspect ratio",
  isAtLeast96x96: " 96x96 or larger",
  isAtLeast696x928: " 696x928px or larger",
  isAtLeast928x696: " 928x696px or larger",
  isAtLeast928x928: " 928x928px or larger",
};

export class StoryMetadataThumbnailsAreOk extends Rule {
  async run(context: Context) {
    // Requirements are from
    // https://github.com/ampproject/amphtml/blob/master/extensions/amp-story/amp-story.md#new-metadata-requirements.
    function isSquare({ width, height }: ImageSize) {
      return width === height;
    }
    function isPortrait({ width, height }: ImageSize) {
      return width > 0.74 * height && width < 0.76 * height;
    }
    function isLandscape({ width, height }: ImageSize) {
      return height > 0.74 * width && height < 0.76 * width;
    }
    function isRaster({ mime }: ImageSize) {
      return ["image/jpeg", "image/gif", "image/png", "image/webp"].includes(
        mime
      );
    }
    function isAtLeast96x96({ width, height }: ImageSize) {
      return width >= 96 && height >= 96;
    }
    function isAtLeast928x928({ width, height }: ImageSize) {
      return width >= 928 && height >= 928;
    }
    function isAtLeast696x928({ width, height }: ImageSize) {
      return width >= 696 && height >= 928;
    }
    function isAtLeast928x696({ width, height }: ImageSize) {
      return width >= 928 && height >= 696;
    }
    const metadata = inlineMetadata(context.$);
    const assert = async (
      attr: keyof Metadata,
      isMandatory: boolean,
      expected: Array<(info: ImageSize) => boolean>
    ): Promise<Result> => {
      const url = metadata[attr];
      if (!url) {
        return isMandatory ? this.fail(`${attr} is missing`) : this.pass();
      }
      try {
        const info = await dimensions(context, url);
        const failed = expected.filter((fn) => !fn(info)).map((fn) => fn.name);
        return failed.length === 0
          ? this.pass()
          : this.fail(formatForHumans(attr.toString(), url, failed.join(", ")));
      } catch (e) {
        const s = absoluteUrl(url, context.url);
        switch (e.message) {
          case "unrecognized file format":
            return this.fail(`[${attr}] (${s}) unrecognized file format`);
          case "bad status code: 404":
            return this.fail(`[${attr}] (${s}) 404 file not found`);
          default:
            return this.fail(`[${attr}] (${s}) error: ${JSON.stringify(e)}`);
        }
      }
    };
    let formatForHumans: (
      attr: string,
      url: any,
      failed: string
    ) => string = function (attr: string, url: any, failed: string) {
      let m = `${attr} should be`;
      failed.split(",").forEach(function (el) {
        m = m + outputMessageMap[el] + " and";
      });
      //Remove the last ' and' + tack on the src
      m = m.slice(0, m.length - 4) + `\nsrc: ${url}`;
      return m;
    };
    const res = [
      assert("publisher-logo-src", true, [isRaster, isSquare, isAtLeast96x96]),
      assert("poster-portrait-src", true, [
        isRaster,
        isPortrait,
        isAtLeast696x928,
      ]),
      assert("poster-square-src", false, [
        isRaster,
        isSquare,
        isAtLeast928x928,
      ]),
      assert("poster-landscape-src", false, [
        isRaster,
        isLandscape,
        isAtLeast928x696,
      ]),
    ];
    return (await Promise.all(res)).filter(notPass);
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/components/amp-story/#new-metadata-requirements",
        title: "AMP Story preview metadata is correct size and aspect ratio",
      info: "",
    };
  }
}

export { inlineMetadata as _inlineMetadata };
