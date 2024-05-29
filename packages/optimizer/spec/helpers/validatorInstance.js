const path = require('path');
const validator = require('amphtml-validator');

let instance = null;

module.exports = {
  get: () => {
    if (!instance) {
      console.error('Validator instance created: ' + path.join(__dirname, 'validator.js'));
      instance = validator.getInstance(path.join(__dirname, 'validator.js'));
    }
    return instance;
  },
};
