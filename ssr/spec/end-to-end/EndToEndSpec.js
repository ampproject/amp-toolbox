const createSpec = require('../helpers/TransformerRunner.js');
const transformer = require('../../index.js').createTransformer();

createSpec({
  name: 'End-to-End',
  testDir: __dirname,
  transformer: {
    transform: (tree, params) => transformer.transformTree(tree, params)
  }
});
