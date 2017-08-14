const DomTransfomer = require('./lib/DomTransformer.js');
const treeParser = require('./lib/TreeParser.js');
const serverSideRendering = require('./lib/transformers/ServerSideRendering.js');

module.exports = {
  createTransformer: config => {
    config = Object.assign(defaultConfig, config);
    return new DomTransfomer(treeParser, config);
  }
}

const defaultConfig = module.exports.defaultConfig = {
  transformers: [serverSideRendering]
}
