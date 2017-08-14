require('colors')
const jsdiff = require('diff');
const { basename, join } = require('path')
const { getFileContents, getHtmlFiles, getDirectories } = require('../support/Utils.js')

const treeParser = require('../../lib/TreeParser.js')

const TRANSFORMER_DIR = '../../lib/transformers';

describe('Transfomers', () => {
  loadTestConfigs().forEach(testConfig => {
    describe(testConfig.name, () => {
      getDirectories(testConfig.testDir).forEach(testDir => {
        it(basename(testDir), () => {
          const inputTree = parseTree(testDir, 'input.html');
          const expectedOutputTree = parseTree(testDir, 'expected_output.html');
          testConfig.transformer.transform(inputTree);
          compare(inputTree, expectedOutputTree);
        });
      });
    });
  });
});

function loadTestConfigs() {
  const transfomerTestDirs = getDirectories(join(__dirname, 'data'));
  return transfomerTestDirs.map(testDir => {
    const transformerName = basename(testDir);
    return {
      name: transformerName,
      testDir: testDir,
      transformer: require(join(TRANSFORMER_DIR, transformerName + '.js')),
    }
  });
}

function parseTree(dir, file) {
  return treeParser.parse(getFileContents(join(dir, file)));
}

function compare(actualTree, expectedTree) {
  const actualHtml = treeParser.serialize(actualTree);
  const expectedHtml = treeParser.serialize(expectedTree);
  const diff = jsdiff.diffChars(actualHtml, expectedHtml);
  let failed = false;
  const reason = diff.map(part => {
    const color = part.added ? 'green' :
      part.removed ? 'red' : 'reset';
    failed = part.added || part.removed || failed;
    return part.value[color];
  }).join('');

  if (failed) {
    fail('Trees do not match\n\n' + reason + '\n\n');
  }
}
