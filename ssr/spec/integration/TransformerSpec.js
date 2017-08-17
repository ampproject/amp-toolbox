const colors = require('colors/safe');
const jsdiff = require('diff');
const minify = require('html-minifier').minify;
const {basename, join} = require('path');
const {getFileContents, getDirectories} = require('../support/Utils.js');

const treeParser = require('../../lib/TreeParser.js');

const TRANSFORMER_DIR = '../../lib/transformers';

const TRANFORMER_PARAMS = {
  ampUrlPrefix: '/amp'
};

describe('Transfomers', () => {
  loadTestConfigs().forEach(createSpec);
});

function createSpec(testConfig) {
  describe(testConfig.name, () => {
    getDirectories(testConfig.testDir).forEach(testDir => {
      it(basename(testDir), () => {
        const inputTree = parseTree(testDir, 'input.html');
        const expectedOutputTree = parseTree(testDir, 'expected_output.html');
        testConfig.transformer.transform(inputTree, TRANFORMER_PARAMS);
        compare(inputTree, expectedOutputTree);
      });
    });
  });
}

function loadTestConfigs() {
  const transfomerTestDirs = getDirectories(join(__dirname, 'data'));
  return transfomerTestDirs.map(testDir => {
    const transformerName = basename(testDir);
    return {
      name: transformerName,
      testDir: testDir,
      transformer: require(join(TRANSFORMER_DIR, transformerName + '.js'))
    };
  });
}

function parseTree(dir, file) {
  return treeParser.parse(getFileContents(join(dir, file)));
}

function compare(actualTree, expectedTree) {
  const actualHtml = serialize(actualTree);
  const expectedHtml = serialize(expectedTree);
  const diff = jsdiff.diffChars(expectedHtml, actualHtml);
  let failed = false;
  const reason = diff.map(part => {
    let string;
    if (part.added) {
      string = colors.green(part.value);
      failed = true;
    } else if (part.removed) {
      string = colors.red(part.value);
      failed = true;
    } else {
      string = colors.reset(part.value);
    }
    return string;
  }).join('');

  if (failed) {
    fail('Trees do not match\n\n' + reason + '\n\n');
  }
}

function serialize(tree) {
  const html = treeParser.serialize(tree);
  return minify(html, {collapseWhitespace: true});
}
