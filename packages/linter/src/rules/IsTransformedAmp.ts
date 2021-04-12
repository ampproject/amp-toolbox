import {Context} from '../index';
import {Rule} from '../rule';
import {isTransformedAmp} from '../helper';

export class IsTransformedAmp extends Rule {
  run({$}: Context) {
    return isTransformedAmp($) ? this.pass() : this.warn('No transformed AMP found');
  }
  meta() {
    return {
      url:
        'https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/',
      title: 'Page is transformed AMP',
      info: '',
    };
  }
}
