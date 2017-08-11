const parse5 = require('parse5');

class DocumentParser {
  parse(html) {
    return parse5.parse(html);
  }

  serialize(document) {
    return parse5.serialize(document);
  }
}

module.exports = DocumentParser;