/**
 * Copyright 2021  The AMP HTML Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const {test, expect} = require('@jest/globals');
const parseFontface = require('./parseFontface');

test('parses src', () => {
  const styles = `
@font-face {
  font-family: "Open Sans";
  font-style: normal;
  font-weight: normal;
  unicode-range: U+A,U+20,U+26-29,U+2C-39,U+3F,U+41-59,U+61-69,U+6B-70,U+72-7A,U+A9,U+2019;
  src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"), url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
}
`;
  const fontfaces = parseFontface(styles, 'http://example.com');
  const openSans = fontfaces.get('Open Sans');
  expect(openSans.src).toBe(
    'url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"), url("/fonts/OpenSans-Regular-webfont.woff") format("woff")'
  );
  expect(openSans.mainSrc).toBe('http://example.com/fonts/OpenSans-Regular-webfont.woff2');
});

test('uses first woff2 file as mainSrc', () => {
  const styles = `
@font-face {
  font-family: "Open Sans";
  src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),
       url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
}
`;
  const fontfaces = parseFontface(styles, 'http://example.com');
  const openSans = fontfaces.get('Open Sans');
  expect(openSans.mainSrc).toBe('http://example.com/fonts/OpenSans-Regular-webfont.woff2');
});

test('uses woff file as mainSrc', () => {
  const styles = `
@font-face {
  font-family: "Open Sans";
  font-weight: "400";
  font-display: "optional";
  src: url("/fonts/OpenSans-Regular-webfont.tff") format("tff"),
       url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
}
`;
  const fontfaces = parseFontface(styles, 'http://example.com');
  const openSans = fontfaces.get('Open Sans');
  expect(openSans.mainSrc).toBe('http://example.com/fonts/OpenSans-Regular-webfont.woff');
});

test('no src', () => {
  const styles = `
@font-face {
  font-family: "Open Sans";
}
`;
  const fontfaces = parseFontface(styles, 'http://example.com');
  const openSans = fontfaces.get('Open Sans');
  expect(openSans.src).toBe(undefined);
  expect(openSans.mainSrc).toBe(undefined);
});

test('does not fail on invalid css', () => {
  const styles = `
  test test test
@font-face {
  font-family: "Open Sans";
}
`;
  parseFontface(styles, 'http://example.com');
});
