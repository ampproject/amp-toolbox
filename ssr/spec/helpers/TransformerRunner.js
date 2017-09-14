const colors = require('colors/safe');
const jsdiff = require('diff');
const minify = require('html-minifier').minify;
const {basename, join} = require('path');
const {getFileContents, getDirectories} = require('../helpers/Utils.js');

const treeParser = require('../../lib/TreeParser.js');

const TRANFORMER_PARAMS = {
  ampUrlPrefix: '/amp',
  ampUrl: 'https://example.com/amp-version.html'
};

module.exports = function(testConfig) {
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
};

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
    fail('Trees do not match\n\n' + reason + '\n\n' + actualHtml + '\n\n');
  }
}

function serialize(tree) {
  const html = treeParser.serialize(tree);
  return minify(html, {collapseWhitespace: true});
}
