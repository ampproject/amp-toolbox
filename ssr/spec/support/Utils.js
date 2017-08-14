'mode strict'

const { basename, join } = require('path')
const { lstatSync, readdirSync, readFileSync } = require('fs')

module.exports = {};

const isDirectory = module.exports.isDirectory =
  source => lstatSync(source).isDirectory();

const isFile = module.exports.isFile =
  source => !isDirectory(source);

const getResources = source => readdirSync(source)
  .map(name => join(source, name));

const getDirectories = module.exports.getDirectories =
  source => getResources(source).filter(isDirectory);

const getFiles = module.exports.getFiles =
  source => getResources(source).filter(isFile);

const getHtmlFiles = module.exports.getHtmlFiles =
  source => getFiles(source).filter(file => file.endsWith('.html'));

module.exports.getFileContents = filePath => readFileSync(filePath, 'utf8');
