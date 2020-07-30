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
  isAtLeast96x96: " at least 96x96 or larger",
  isAtLeast640x640: " 640x640px or larger",
  isAtLeast640x853: " 640x853px or larger",
  isAtLeast853x640: " 853x640px or larger",
};

export class StoryMetadataThumbnailsAreOk extends Rule {
  async run(context: Context) {
    // Requirements are from
    // https://amp.dev/documentation/components/amp-story/#poster-guidelines-for-poster-portrait-src-poster-landscape-src-and-poster-square-src
    // Last Updated: July 8th, 2020
    function isSquare({ width, height }: ImageSize) {
      return width > 0.9 * height && width < 1.1 * height;
    }
    function isPortrait({ width, height }: ImageSize) {
      return width > 0.65 * height && width < 0.85 * height;
    }
    function isLandscape({ width, height }: ImageSize) {
      return height > 0.65 * width && height < 0.85 * width;
    }
    function isRaster({ mime }: ImageSize) {
      return ["image/jpeg", "image/gif", "image/png", "image/webp"].includes(
        mime
      );
    }
    function isAtLeast96x96({ width, height }: ImageSize) {
      return width >= 96 && height >= 96;
    }
    function isAtLeast640x640({ width, height }: ImageSize) {
      return width >= 640 && height >= 640;
    }
    function isAtLeast640x853({ width, height }: ImageSize) {
      return width >= 640 && height >= 853;
    }
    function isAtLeast853x640({ width, height }: ImageSize) {
      return width >= 853 && height >= 640;
    }
    const metadata = inlineMetadata(context.$);
    const assert = async (
      attr: keyof Metadata,
      isMandatory: boolean,
      expected: Array<(info: ImageSize) => boolean>
    ): Promise<Result> => {
      const url = metadata[attr];
      if (!url) {
        return isMandatory
          ? this.fail(`${attr} is missing`)
          : this.info(`${attr} is not mandatory`);
      }
      try {
        const info = await dimensions(context, url);
        const failed = expected.filter((fn) => !fn(info)).map((fn) => fn.name);

        return failed.length === 0
          ? this.pass(`> ${attr} = ${metadata[attr]}`)
          : this.fail(formatForHumans(attr.toString(), url, failed.join()));
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
        isAtLeast640x853,
      ]),
      assert("poster-square-src", false, [
        isRaster,
        isSquare,
        isAtLeast640x640,
      ]),
      assert("poster-landscape-src", false, [
        isRaster,
        isLandscape,
        isAtLeast853x640,
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
