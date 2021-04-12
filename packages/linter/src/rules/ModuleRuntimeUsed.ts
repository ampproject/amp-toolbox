import {Context} from '../index';
import {Rule} from '../rule';
import {isTransformedAmp} from '../helper';

export class ModuleRuntimeUsed extends Rule {
  run({$}: Context) {
    if (!isTransformedAmp($)) {
      return this.pass();
    }
    const isModuleVersion = $("script[type='module'][src$='/v0.mjs']").length > 0;
    return isModuleVersion
      ? this.pass()
      : this.warn('The JavaScript module version of the AMP Runtime is not used');
  }
  meta() {
    return {
      url:
        'https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/',
      title: 'Page is using JavaScript Module version of the AMP Runtime',
      info: '',
    };
  }
}
