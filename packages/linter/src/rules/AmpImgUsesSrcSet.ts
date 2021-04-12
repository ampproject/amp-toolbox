import {Context, Result} from '../index';
import {Rule} from '../rule';
import {notPass} from '../filter';

const CHECKED_IMG_LAYOUTS = ['fill', 'flex-item', 'intrinsic', 'responsive'];

const SVG_URL_PATTERN = /^[^?]+\.svg(\?.*)?$/i;

export class AmpImgUsesSrcSet extends Rule {
  async run(context: Context) {
    const $ = context.$;

    const incorrectImages = $('amp-img').filter((_, e) => {
      const src = $(e).attr('src');
      let layout = $(e).attr('layout');
      const srcset = $(e).attr('srcset');
      const parent = $(e).parent();
      if (parent.prop('tagName').startsWith('AMP-')) {
        const parentLayout = $(parent).attr('layout');
        if (parentLayout) {
          layout = parentLayout;
        }
      }
      return (
        !SVG_URL_PATTERN.exec(src) && layout && CHECKED_IMG_LAYOUTS.includes(layout) && !srcset
      );
    });
    return (
      await Promise.all(
        incorrectImages
          .map((_, e) => {
            const s = $(e).toString();
            return this.warn(`[${s}] should define a srcset. Using AMP Optimizer might help.`);
          })
          .get() as Array<Promise<Result>>
      )
    ).filter(notPass);
  }
  meta() {
    return {
      url:
        'https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/explainer/?format=websites#image-optimization',
      title: '<amp-img> with non-fixed layout uses srcset',
      info: '',
    };
  }
}
