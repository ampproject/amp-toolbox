const DomTransfomer = require('./lib/DomTransformer.js');
const treeParser = require('./lib/TreeParser.js');
const serverSideRendering = require('./lib/transformers/ServerSideRendering.js');

const defaultConfig = {
  transformers: [serverSideRendering]
};

module.exports = {
  createTransformer: config => {
    config = Object.assign(defaultConfig, config);
    return new DomTransfomer(treeParser, config);
  },
  defaultConfig: defaultConfig
};

