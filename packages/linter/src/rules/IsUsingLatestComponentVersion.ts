import {Context} from '../index';
import {Rule} from '../rule';
import validatorRules from '@ampproject/toolbox-validator-rules';

const COMPONENT_SRC_MATCHER = /\/v0\/([^.]+)-(\d+(?:\.\d+)*)\.m?js/;

export class IsUsingLatestComponentVersion extends Rule {
  async run({$}: Context) {
    const versionMap = {};
    $('script[src]').each((i, script) => {
      const match = COMPONENT_SRC_MATCHER.exec($(script).attr('src'));
      if (match) {
        versionMap[match[1]] = match[2];
      }
    });

    const rules = await validatorRules.fetch();
    const componentVersions = {};
    rules.extensions.forEach((e) => {
      const versions = e.version.filter((v) => v !== 'latest');
      if (e.htmlFormat.some((h) => h === 'AMP')) {
        componentVersions[e.name] = versions[versions.length - 1];
      }
    });

    const isUsingLatestComponentVersion = Object.entries(versionMap).filter(([name, version]) => {
      return componentVersions[name] !== version;
    });

    return isUsingLatestComponentVersion.length === 0
      ? this.pass()
      : this.warn('Use the latest version of components');
  }
  meta() {
    return {
      url: '',
      title: 'Outdated components are used',
      info: '',
    };
  }
}
