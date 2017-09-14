'mode strict';

const {join} = require('path');
const {lstatSync, readdirSync, readFileSync} = require('fs');

module.exports = {};

const isDirectory = module.exports.isDirectory =
  source => lstatSync(source).isDirectory();

const getResources = source => readdirSync(source)
  .map(name => join(source, name));

module.exports.getDirectories =
  source => getResources(source).filter(isDirectory);

module.exports.getFileContents = filePath => readFileSync(filePath, 'utf8');
