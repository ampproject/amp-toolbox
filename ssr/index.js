const DomTransfomer = require('./lib/DomTransformer.js');

const defaultConfig = {
  transformers: [
    'AddAmpLink',
    'RewriteAmpUrls',
    'ServerSideRendering',
    'RemoveAmpAttribute',
    'AmpBoilerplateTransformer', // needs to run after serverSideRendering
    'ReorderHeadTransformer'    // needs to run last
  ].map(loadTransformer)
};

function loadTransformer(name) {
  return require('./lib/transformers/' + name + '.js');
}

module.exports = {
  createTransformer: config => {
    config = Object.assign(defaultConfig, config);
    return DomTransfomer.create(config);
  },
  defaultConfig: defaultConfig
};

