const {basename, join} = require('path');
const {getDirectories} = require('../helpers/Utils.js');
const createSpec = require('../helpers/TransformerRunner.js');

describe('Transfomers', () => {
  loadTestConfigs().forEach(createSpec);
});

function loadTestConfigs() {
  const transfomerTestDirs = getDirectories(__dirname);
  return transfomerTestDirs.map(testDir => {
    const transformerName = basename(testDir);
    return {
      name: transformerName,
      testDir: testDir,
      transformer: require(join('../../lib/transformers', transformerName + '.js'))
    };
  });
}
