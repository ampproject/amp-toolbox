describe('AMP Server Side Rendering', () => {

  let transfomer

  beforeEach(() => {
    transfomer = require('../index.js').createTransformer();
  });

  it('converts a simple AMP document', () => {
    const input = `<html amp></html>`;
    const result = transfomer.transform(input, {});
    expect(result).toBe(`<html i-amphtml-layout i-amphtml-no-boilerplate></html>`);
  }); 
});