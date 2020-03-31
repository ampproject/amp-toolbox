/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import Url from 'url-parse';
import punycode from 'punycode';

// Our imports that are dynamically filtered
// by rollup
import browserSha256 from './browser/Sha256';
import nodeSha256 from './node/Sha256';

/** @type {string} */
const LTR_CHARS =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
  '\u200E\u2C00-\uFB1C\uFE00-\uFE6F\uFEFD-\uFFFF';

/** @type {string} */
const RTL_CHARS = '\u0591-\u06EF\u06FA-\u07FF\u200F\uFB1D-\uFDFF\uFE70-\uFEFC';

/** @type {RegExp} */
const HAS_LTR_CHARS = new RegExp('[' + LTR_CHARS + ']');

/** @type {RegExp} */
const HAS_RTL_CHARS = new RegExp('[' + RTL_CHARS + ']');

/** @private {number} */
const MAX_DOMAIN_LABEL_LENGTH_ = 63;

/**
 * Constructs a curls domain following these instructions:
 * 1. Convert pub.com from IDN (punycode) to utf-8, if applicable.
 * 2. Replace every “-” with “--”.
 * 3. Replace each “.” with “-”.
 * 4. Convert back to IDN.
 *
 * Examples:
 *   'https://something.com/'    =>  'something-com'
 *   'https://SOMETHING.COM/'    =>  'something-com'
 *   'https://hello-world.com'  =>  'hello--world-com'
 *   'https://hello--world.com' =>  'hello----world-com'
 *
 * Fallback applies to the following cases:
 * - RFCs don’t permit a domain label to exceed 63 characters.
 * - RFCs don’t permit any domain label to contain a mix of right-to-left and
 *   left-to-right characters.
 * - If the origin domain contains no “.” character.
 *
 * Fallback Algorithm:
 * 1. Take the SHA256 of the punycode view of the domain.
 * 2. Base32 encode the resulting hash. Set the domain prefix to the resulting
 *    string.
 *
 * Also, this will only use the domain (hostname) from the passed URL to give output
 *
 * @param {string} url The complete publisher url.
 * @return {!Promise<string>} The curls encoded domain.
 * @private
 */
function createCurlsSubdomain(url) {
  // Get our domain from the passed url string
  const domain = new Url(url).hostname;
  if (isEligibleForHumanReadableCacheEncoding_(domain)) {
    let curlsEncoding = constructHumanReadableCurlsCacheDomain_(domain);
    if (curlsEncoding.length > MAX_DOMAIN_LABEL_LENGTH_) {
      return constructFallbackCurlsCacheDomain_(domain);
    }
    if (hasInvalidHyphen34_(curlsEncoding)) {
      curlsEncoding = constructCurlsCacheDomainForHyphen34_(curlsEncoding);
    }
    return Promise.resolve(curlsEncoding);
  } else {
    return constructFallbackCurlsCacheDomain_(domain);
  }
}

/**
 * Determines whether the given domain can be validly encoded into a human
 * readable curls encoded cache domain.  A domain is eligible as long as:
 *   It does not have hyphens in positions 3&4.
 *   It does not exceed 63 characters
 *   It does not contain a mix of right-to-left and left-to-right characters
 *   It contains a dot character
 *
 * @param {string} domain The domain to validate
 * @return {boolean}
 * @private
 */
function isEligibleForHumanReadableCacheEncoding_(domain) {
  if (hasInvalidHyphen34_(domain)) {
    return false;
  }
  const unicode = punycode.toUnicode(domain);
  return (
    domain.length <= MAX_DOMAIN_LABEL_LENGTH_ &&
    !(HAS_LTR_CHARS.test(unicode) && HAS_RTL_CHARS.test(unicode)) &&
    domain.indexOf('.') != -1
  );
}

/**
 * Constructs a human readable curls encoded cache domain using the following
 * algorithm:
 *   Convert domain from punycode to utf-8 (if applicable)
 *   Replace every '-' with '--'
 *   Replace every '.' with '-'
 *   Convert back to punycode (if applicable)
 *
 * @param {string} domain The publisher domain
 * @return {string} The curls encoded domain
 * @private
 */
function constructHumanReadableCurlsCacheDomain_(domain) {
  domain = punycode.toUnicode(domain);
  domain = domain.split('-').join('--');
  domain = domain.split('.').join('-');
  return punycode.toASCII(domain).toLowerCase();
}

/**
 * Constructs a fallback curls encoded cache domain by taking the SHA256 of
 * the domain and base32 encoding it.
 *
 * @param {string} domain The publisher domain
 * @return {!Promise<string>}
 * @private
 */
function constructFallbackCurlsCacheDomain_(domain) {
  return sha256_(domain).then((digest) => encodeHexToBase32_(digest));
}

/**
 * Function to get a sha256 representation of the specified string.
 * This uses babel-plugin-filer-imports, so that the import
 * that is not for the specified platform is removed.
 * @param {string} str The string to convert to sha256
 * @return {!Promise<string>}
 * @private
 */
function sha256_(str) {
  if (typeof window !== 'undefined') {
    return browserSha256(str);
  } else {
    return nodeSha256(str);
  }
}

/**
 * Encodes a hex string in base 32 according to specs in RFC 4648 section 6:
 * https://tools.ietf.org/html/rfc4648
 *
 * @param {string} hexString the hex string
 * @return {string} the base32 encoded string
 * @private
 */
function encodeHexToBase32_(hexString) {
  const initialPadding = 'ffffffffff';
  const finalPadding = '000000';
  const paddedHexString = initialPadding + hexString + finalPadding;
  const encodedString = encode32_(paddedHexString);

  const bitsPerHexChar = 4;
  const bitsPerBase32Char = 5;
  const numInitialPaddingChars = (initialPadding.length * bitsPerHexChar) / bitsPerBase32Char;
  const numHexStringChars = Math.ceil((hexString.length * bitsPerHexChar) / bitsPerBase32Char);

  const result = encodedString.substr(numInitialPaddingChars, numHexStringChars);
  return result;
}

/**
 * We use the base32 character encoding defined here:
 * https://tools.ietf.org/html/rfc4648#page-8
 *
 * @param {string} paddedHexString
 * @return {string} the base32 string
 * @private
 */
function encode32_(paddedHexString) {
  let bytes = [];
  paddedHexString.match(/.{1,2}/g).forEach((pair, i) => {
    bytes[i] = parseInt(pair, 16);
  });

  // Split into groups of 5 and convert to base32.
  const base32 = 'abcdefghijklmnopqrstuvwxyz234567';
  const leftover = bytes.length % 5;
  let quanta = Math.floor(bytes.length / 5);
  const parts = [];

  if (leftover != 0) {
    for (let i = 0; i < 5 - leftover; i++) {
      bytes += '\x00';
    }
    quanta += 1;
  }

  for (let i = 0; i < quanta; i++) {
    parts.push(base32.charAt(bytes[i * 5] >> 3));
    parts.push(base32.charAt(((bytes[i * 5] & 0x07) << 2) | (bytes[i * 5 + 1] >> 6)));
    parts.push(base32.charAt((bytes[i * 5 + 1] & 0x3f) >> 1));
    parts.push(base32.charAt(((bytes[i * 5 + 1] & 0x01) << 4) | (bytes[i * 5 + 2] >> 4)));
    parts.push(base32.charAt(((bytes[i * 5 + 2] & 0x0f) << 1) | (bytes[i * 5 + 3] >> 7)));
    parts.push(base32.charAt((bytes[i * 5 + 3] & 0x7f) >> 2));
    parts.push(base32.charAt(((bytes[i * 5 + 3] & 0x03) << 3) | (bytes[i * 5 + 4] >> 5)));
    parts.push(base32.charAt(bytes[i * 5 + 4] & 0x1f));
  }

  let replace = 0;
  if (leftover == 1) replace = 6;
  else if (leftover == 2) replace = 4;
  else if (leftover == 3) replace = 3;
  else if (leftover == 4) replace = 1;

  for (let i = 0; i < replace; i++) parts.pop();
  for (let i = 0; i < replace; i++) parts.push('=');

  return parts.join('');
}

/**
 * Determines if a domain or curls encoded proxy domain is allowed to have a
 * hyphen in positions 3&4.
 *
 * @param {string} domainOrCurls A publisher domain or curls encoded proxy
 *   domain
 * @return {boolean}
 * @private
 */
function hasInvalidHyphen34_(domainOrCurls) {
  return domainOrCurls.slice(2, 4) == '--' && domainOrCurls.slice(0, 2) != 'xn';
}

/**
 * Constructs a human readable curls for when the constructed curls has a
 * hyphen in position 3&4.
 *
 * @param {string} curlsEncoding The curls encoded domain with hyphen in
 *   position 3&4
 * @return {string} The transformed curls encoded domain
 * @private
 */
function constructCurlsCacheDomainForHyphen34_(curlsEncoding) {
  const prefix = '0-';
  return prefix.concat(curlsEncoding, '-0');
}

/** @module AmpCurlUrl */
export default createCurlsSubdomain;
