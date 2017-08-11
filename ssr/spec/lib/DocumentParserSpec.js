const DocumentParser = require('../../lib/DocumentParser.js');

describe('Document Parser', () => {
  const documentParser = new DocumentParser();

  describe('First Child by Tag ID', () => {
    it('returns First Child', () => {
      const document = documentParser.parse('<!doctype html><html></html>');
      expect(document).toBeDefined();
    });
  });
});