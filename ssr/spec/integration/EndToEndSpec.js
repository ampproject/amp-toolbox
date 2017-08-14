describe('AMP Server Side Rendering', () => {
  let transfomer;

  beforeEach(() => {
    transfomer = require('../../index.js').createTransformer();
  });

  it('converts a simple AMP document', () => {
    const input = '<!DOCTYPE html><html amp></html>';
    const result = transfomer.transform(input);
    expect(result).toContain('i-amphtml-layout');
  });
});
