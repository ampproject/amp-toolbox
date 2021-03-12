const {test, expect} = require('@jest/globals');
const parseFontfaceSrc = require('./parseFontfaceSrc');

test('returns woff2 value', () => {
  const src = parseFontfaceSrc(
    'url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"), url("/fonts/OpenSans-Regular-webfont.woff") format("woff")',
    'https://example.com'
  );
  expect(src).toBe('https://example.com/fonts/OpenSans-Regular-webfont.woff2');
});

test('uses woff if no woff2 specified', () => {
  const src = parseFontfaceSrc(
    'url("/fonts/OpenSans-Regular-webfont.ttf") format("ttf"), url("/fonts/OpenSans-Regular-webfont.woff") format("woff")',
    'https://example.com'
  );
  expect(src).toBe('https://example.com/fonts/OpenSans-Regular-webfont.woff');
});

test('uses first other format if no woff* format is given', () => {
  const src = parseFontfaceSrc(
    'url("/fonts/OpenSans-Regular-webfont.ttf") format("ttf"), url("/fonts/OpenSans-Regular-webfont.eot") format("eot")',
    'https://example.com'
  );
  expect(src).toBe('https://example.com/fonts/OpenSans-Regular-webfont.ttf');
});

test('uses given origin', () => {
  const src = parseFontfaceSrc(
    'url("http://test.com/fonts/OpenSans-Regular-webfont.woff2") format("woff2"), url("/fonts/OpenSans-Regular-webfont.woff") format("woff")',
    'https://example.com'
  );
  expect(src).toBe('http://test.com/fonts/OpenSans-Regular-webfont.woff2');
});

test('returns empty string if no url', () => {
  const src = parseFontfaceSrc(
    'local(".SFNSText-Light"), local(".HelveticaNeueDeskInterface-Light"), local(".LucidaGrandeUI"), local("Ubuntu Light"), local("Segoe UI Light"), local("Roboto-Light"), local("DroidSans"), local("Tahoma")',
    'https://example.com'
  );
  expect(src).toBe('');
});
