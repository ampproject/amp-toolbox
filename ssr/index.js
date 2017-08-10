const DomTransfomer = require('./lib/dom-transfomer.js');
const DocumentParser = require('./lib/document-parser.js');

module.exports = {
  createTransformer: function(config) {
  const treeParser = new DocumentParser();
  return new DomTransfomer(treeParser, config);
  }
}
