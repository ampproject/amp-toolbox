const path = require('path');
const validator = require('amphtml-validator');

let instance = null;

module.exports = {
  get: () => {
    if (!instance) {
      instance = validator.getInstance(path.join(__dirname, 'validator.js'));
    }
    return instance;
  },
};
