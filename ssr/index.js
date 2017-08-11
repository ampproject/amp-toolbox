const DomTransfomer = require('./lib/DomTransformer.js');
const DocumentParser = require('./lib/DocumentParser.js');
const ServerSideRendering = require('./lib/transformers/ServerSideRendering.js');

module.exports = {
  createTransformer: config => {
    const treeParser = new DocumentParser();
    config = config || createDefaultConfig();
    return new DomTransfomer(treeParser, config);
  }
}

function createDefaultConfig() {
  return {
    transformers: [new ServerSideRendering()]
  }
}