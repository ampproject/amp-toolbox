describe('AMP Server Side Rendering', () => {
  let transfomer;

  beforeEach(() => {
    transfomer = require('../../index.js').createTransformer();
  });

  it('converts a simple AMP document', () => {
    const input = '<!DOCTYPE html><html amp></html>';
    const result = transfomer.transform(input);
    expect(result).toBe(
      '<!DOCTYPE html><html i-amphtml-no-boilerplate=""><head></head><body></body></html>'
    );
  });
});
