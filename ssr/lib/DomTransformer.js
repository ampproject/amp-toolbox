class DomTransformer {

  constructor(documentParser, config) {
    this._documentParser = documentParser;
    this._config = config;
    this._transformers = this._config.transformers;
  }

  transform(html, params) {
    const document = this._documentParser.parse(html);
    this._transform(document, params);
    return this._documentParser.serialize(document);
  }

  _transform(document, params) {
    this._transformers.forEach(transformer => {
      transformer.transform(document, params);
    });
  }
}

module.exports = DomTransformer;