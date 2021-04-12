import {Context, Result} from '../index';
import {Rule} from '../rule';
import {notPass} from '../filter';

export class AmpImgPlaceholderIsDataUri extends Rule {
  async run(context: Context) {
    const $ = context.$;

    const incorrectImages = $('amp-img').filter((_, e) => {
      const placeholders = $(e).children('amp-img[placeholder]');
      const hasIncorrectPlaceholder = !!placeholders
        .toArray()
        .find((placeholder) => !$(placeholder).attr('src').startsWith('data:'));
      return hasIncorrectPlaceholder;
    });

    return (
      await Promise.all(
        incorrectImages
          .map((_, e) => {
            const s = $(e).toString();
            return this.warn(
              `[${s}] has a placeholder that makes a network request. This hurts LCP, omit it or use a data URI.`
            );
          })
          .get() as Array<Promise<Result>>
      )
    ).filter(notPass);
  }
  meta() {
    return {
      url: '',
      title: '<amp-img> placeholder should not make a network request',
      info: '',
    };
  }
}
