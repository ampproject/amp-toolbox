const DomTransfomer = require('./lib/DomTransformer.js');
const treeParser = require('./lib/TreeParser.js');
const serverSideRendering = require('./lib/transformers/ServerSideRendering.js');
const ampBoilerplateTransformer = require('./lib/transformers/AmpBoilerplateTransformer.js');
const reorderHead = require('./lib/transformers/ReorderHeadTransformer.js');
const removeAmpAttribute = require('./lib/transformers/RemoveAmpAttribute.js');

const defaultConfig = {
  transformers: [
    serverSideRendering,
    ampBoilerplateTransformer // need to run after serverSideRendering
    removeAmpAttribute,
    reorderHead // needs to run last
  ]
};

module.exports = {
  createTransformer: config => {
    config = Object.assign(defaultConfig, config);
    return new DomTransfomer(treeParser, config);
  },
  defaultConfig: defaultConfig
};

