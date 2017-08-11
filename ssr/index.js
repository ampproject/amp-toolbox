const DomTransfomer = require('./lib/DomTransformer.js');
const treeParser = require('./lib/TreeParser.js');
const ServerSideRendering = require('./lib/transformers/ServerSideRendering.js');

const defaultConfig = {
  transformers: [new ServerSideRendering()]
};

module.exports = {
  createTransformer: config => {
    return new DomTransfomer(treeParser, Object.assign(defaultConfig, config));
  }
};
