const DomTransfomer = require('./lib/DomTransformer.js');
const DocumentParser = require('./lib/DocumentParser.js');

module.exports = {
  createTransformer: function(config) {
  const treeParser = new DocumentParser();
  return new DomTransfomer(treeParser, config);
  }
}
