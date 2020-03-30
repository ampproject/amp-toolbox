import { absoluteUrl, dimensions } from "../helper";
import { Context, Result } from "../index";
import { Rule } from "../rule";
import { notPass } from "../filter";

export class AmpImgHeightWidthIsOk extends Rule {
  async run(context: Context) {
    const $ = context.$;

    const test = async (
      src: string,
      layout: string,
      expectedWidth: number,
      expectedHeight: number
    ): Promise<Result> => {
      const success = ({
        height,
        width,
      }: {
        height: number;
        width: number;
      }): Promise<Result> => {
        const actualHeight = height;
        const actualWidth = width;
        const actualRatio =
          Math.floor((actualWidth * 100) / actualHeight) / 100;
        const expectedRatio =
          Math.floor((expectedWidth * 100) / expectedHeight) / 100;
        if (Math.abs(actualRatio - expectedRatio) > 0.015) {
          const actualString = `${actualWidth}/${actualHeight} = ${actualRatio}`;
          const expectedString = `${expectedWidth}/${expectedHeight} = ${expectedRatio}`;
          return this.warn(
            `[${src}]: actual ratio [${actualString}] does not match specified [${expectedString}]`
          );
        }
        // "For responsive images, the width and height do not need to match the exact width and height of the amp-img; those values just need to result in the same aspect-ratio." https://amp.dev/documentation/components/amp-img#the-difference-between-responsive-and-intrinsic-layout
        if (layout.toLowerCase() === "responsive") {
          return this.pass();
        }
        const actualVolume = actualWidth * actualHeight;
        const expectedVolume = expectedWidth * expectedHeight;
        if (expectedVolume < 0.25 * actualVolume) {
          const actualString = `${actualWidth}x${actualHeight}`;
          const expectedString = `${expectedWidth}x${expectedHeight}`;
          return this.warn(
            `[${src}]: actual dimensions [${actualString}] are much larger than specified [${expectedString}]`
          );
        }
        if (expectedVolume > 1.5 * actualVolume) {
          const actualString = `${actualWidth}x${actualHeight}`;
          const expectedString = `${expectedWidth}x${expectedHeight}`;
          return this.warn(
            `[${src}]: actual dimensions [${actualString}] are much smaller than specified [${expectedString}]`
          );
        }
        return this.pass();
      };
      const fail = (e: { statusCode: number }) => {
        if (e.statusCode === undefined) {
          return this.fail(`[${src}] ${JSON.stringify(e)}`);
        } else {
          return this.fail(`[${src}] returned status ${e.statusCode}`);
        }
      };
      try {
        const result = await dimensions(
          context,
          absoluteUrl(src, context.url)!
        );
        return success(result);
      } catch (e) {
        return fail(e);
      }
    };
    return (
      await Promise.all(
        ($("amp-img")
          .filter(
            // filter out <amp-img> elements that are the first child of an
            // <amp-story-grid-layer template="fill"> (for these, height/width is
            // ignored).
            (_, e) => !$(e).parent().is("amp-story-grid-layer[template=fill]")
          )
          .map((_, e) => {
            const src = $(e).attr("src") || "";
            const expectedHeight = parseInt($(e).attr("height") || "", 10);
            const expectedWidth = parseInt($(e).attr("width") || "", 10);
            const layout = $(e).attr("layout") || "";
            return test(src, layout, expectedWidth, expectedHeight);
          })
          .get() as unknown) as Array<Promise<Result>>
      )
    ).filter(notPass);
  }
  meta() {
    return {
      url: "",
      title: "All <amp-img> have reasonable width and height",
      info: "",
    };
  }
}
