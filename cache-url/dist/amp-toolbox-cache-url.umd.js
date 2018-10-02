(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global['amp-toolbox-cache-url'] = factory());
}(this, (function () { 'use strict';

	/** Highest positive signed 32-bit float value */
	const maxInt = 2147483647; // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	const base = 36;
	const tMin = 1;
	const tMax = 26;
	const skew = 38;
	const damp = 700;
	const initialBias = 72;
	const initialN = 128; // 0x80
	const delimiter = '-'; // '\x2D'

	/** Regular expressions */
	const regexPunycode = /^xn--/;
	const regexNonASCII = /[^\0-\x7E]/; // non-ASCII chars
	const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

	/** Error messages */
	const errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	};

	/** Convenience shortcuts */
	const baseMinusTMin = base - tMin;
	const floor = Math.floor;
	const stringFromCharCode = String.fromCharCode;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		const result = [];
		let length = array.length;
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		const parts = string.split('@');
		let result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		const labels = string.split('.');
		const encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		const output = [];
		let counter = 0;
		const length = string.length;
		while (counter < length) {
			const value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// It's a high surrogate, and there is a next character.
				const extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // Low surrogate.
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// It's an unmatched surrogate; only append this code unit, in case the
					// next code unit is the high surrogate of a surrogate pair.
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	const ucs2encode = array => String.fromCodePoint(...array);

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	const basicToDigit = function(codePoint) {
		if (codePoint - 0x30 < 0x0A) {
			return codePoint - 0x16;
		}
		if (codePoint - 0x41 < 0x1A) {
			return codePoint - 0x41;
		}
		if (codePoint - 0x61 < 0x1A) {
			return codePoint - 0x61;
		}
		return base;
	};

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	const digitToBasic = function(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	};

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	const adapt = function(delta, numPoints, firstTime) {
		let k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	};

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	const decode = function(input) {
		// Don't use UCS-2.
		const output = [];
		const inputLength = input.length;
		let i = 0;
		let n = initialN;
		let bias = initialBias;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		let basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (let j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			let oldi = i;
			for (let w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				const digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				const baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			const out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output.
			output.splice(i++, 0, n);

		}

		return String.fromCodePoint(...output);
	};

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	const encode = function(input) {
		const output = [];

		// Convert the input in UCS-2 to an array of Unicode code points.
		input = ucs2decode(input);

		// Cache the length.
		let inputLength = input.length;

		// Initialize the state.
		let n = initialN;
		let delta = 0;
		let bias = initialBias;

		// Handle the basic code points.
		for (const currentValue of input) {
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		let basicLength = output.length;
		let handledCPCount = basicLength;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string with a delimiter unless it's empty.
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			let m = maxInt;
			for (const currentValue of input) {
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow.
			const handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (const currentValue of input) {
				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}
				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer.
					let q = delta;
					for (let k = base; /* no condition */; k += base) {
						const t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						const qMinusT = q - t;
						const baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	};

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	const toUnicode = function(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	};

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	const toASCII = function(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	};

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	const punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '2.1.0',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	var punycode_es6 = /*#__PURE__*/Object.freeze({
		ucs2decode: ucs2decode,
		ucs2encode: ucs2encode,
		decode: decode,
		encode: encode,
		toASCII: toASCII,
		toUnicode: toUnicode,
		default: punycode
	});

	// shim for using process in browser
	if (typeof global.setTimeout === 'function') ;
	if (typeof global.clearTimeout === 'function') ;

	// from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
	var performance = global.performance || {};
	var performanceNow =
	  performance.now        ||
	  performance.mozNow     ||
	  performance.msNow      ||
	  performance.oNow       ||
	  performance.webkitNow  ||
	  function(){ return (new Date()).getTime() };

	// Copyright Joyent, Inc. and other Node contributors.

	function isNull(arg) {
	  return arg === null;
	}

	function isNullOrUndefined(arg) {
	  return arg == null;
	}

	function isString(arg) {
	  return typeof arg === 'string';
	}

	function isObject(arg) {
	  return typeof arg === 'object' && arg !== null;
	}

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.


	// If obj.hasOwnProperty has been overridden, then calling
	// obj.hasOwnProperty(prop) will break.
	// See: https://github.com/joyent/node/issues/1707
	function hasOwnProperty$1(obj, prop) {
	  return Object.prototype.hasOwnProperty.call(obj, prop);
	}
	var isArray$1 = Array.isArray || function (xs) {
	  return Object.prototype.toString.call(xs) === '[object Array]';
	};
	function stringifyPrimitive(v) {
	  switch (typeof v) {
	    case 'string':
	      return v;

	    case 'boolean':
	      return v ? 'true' : 'false';

	    case 'number':
	      return isFinite(v) ? v : '';

	    default:
	      return '';
	  }
	}

	function stringify (obj, sep, eq, name) {
	  sep = sep || '&';
	  eq = eq || '=';
	  if (obj === null) {
	    obj = undefined;
	  }

	  if (typeof obj === 'object') {
	    return map$1(objectKeys(obj), function(k) {
	      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
	      if (isArray$1(obj[k])) {
	        return map$1(obj[k], function(v) {
	          return ks + encodeURIComponent(stringifyPrimitive(v));
	        }).join(sep);
	      } else {
	        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
	      }
	    }).join(sep);

	  }

	  if (!name) return '';
	  return encodeURIComponent(stringifyPrimitive(name)) + eq +
	         encodeURIComponent(stringifyPrimitive(obj));
	}
	function map$1 (xs, f) {
	  if (xs.map) return xs.map(f);
	  var res = [];
	  for (var i = 0; i < xs.length; i++) {
	    res.push(f(xs[i], i));
	  }
	  return res;
	}

	var objectKeys = Object.keys || function (obj) {
	  var res = [];
	  for (var key in obj) {
	    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
	  }
	  return res;
	};

	function parse(qs, sep, eq, options) {
	  sep = sep || '&';
	  eq = eq || '=';
	  var obj = {};

	  if (typeof qs !== 'string' || qs.length === 0) {
	    return obj;
	  }

	  var regexp = /\+/g;
	  qs = qs.split(sep);

	  var maxKeys = 1000;
	  if (options && typeof options.maxKeys === 'number') {
	    maxKeys = options.maxKeys;
	  }

	  var len = qs.length;
	  // maxKeys <= 0 means that we should not limit keys count
	  if (maxKeys > 0 && len > maxKeys) {
	    len = maxKeys;
	  }

	  for (var i = 0; i < len; ++i) {
	    var x = qs[i].replace(regexp, '%20'),
	        idx = x.indexOf(eq),
	        kstr, vstr, k, v;

	    if (idx >= 0) {
	      kstr = x.substr(0, idx);
	      vstr = x.substr(idx + 1);
	    } else {
	      kstr = x;
	      vstr = '';
	    }

	    k = decodeURIComponent(kstr);
	    v = decodeURIComponent(vstr);

	    if (!hasOwnProperty$1(obj, k)) {
	      obj[k] = v;
	    } else if (isArray$1(obj[k])) {
	      obj[k].push(v);
	    } else {
	      obj[k] = [obj[k], v];
	    }
	  }

	  return obj;
	}

	// Copyright Joyent, Inc. and other Node contributors.
	var url = {
	  parse: urlParse,
	  resolve: urlResolve,
	  resolveObject: urlResolveObject,
	  format: urlFormat,
	  Url: Url
	};
	function Url() {
	  this.protocol = null;
	  this.slashes = null;
	  this.auth = null;
	  this.host = null;
	  this.port = null;
	  this.hostname = null;
	  this.hash = null;
	  this.search = null;
	  this.query = null;
	  this.pathname = null;
	  this.path = null;
	  this.href = null;
	}

	// Reference: RFC 3986, RFC 1808, RFC 2396

	// define these here so at least they only have to be
	// compiled once on the first module load.
	var protocolPattern = /^([a-z0-9.+-]+:)/i,
	  portPattern = /:[0-9]*$/,

	  // Special case for a simple path URL
	  simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

	  // RFC 2396: characters reserved for delimiting URLs.
	  // We actually just auto-escape these.
	  delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

	  // RFC 2396: characters not allowed for various reasons.
	  unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

	  // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
	  autoEscape = ['\''].concat(unwise),
	  // Characters that are never ever allowed in a hostname.
	  // Note that any invalid chars are also handled, but these
	  // are the ones that are *expected* to be seen, so we fast-path
	  // them.
	  nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
	  hostEndingChars = ['/', '?', '#'],
	  hostnameMaxLen = 255,
	  hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
	  hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
	  // protocols that can allow "unsafe" and "unwise" chars.
	  unsafeProtocol = {
	    'javascript': true,
	    'javascript:': true
	  },
	  // protocols that never have a hostname.
	  hostlessProtocol = {
	    'javascript': true,
	    'javascript:': true
	  },
	  // protocols that always contain a // bit.
	  slashedProtocol = {
	    'http': true,
	    'https': true,
	    'ftp': true,
	    'gopher': true,
	    'file': true,
	    'http:': true,
	    'https:': true,
	    'ftp:': true,
	    'gopher:': true,
	    'file:': true
	  };

	function urlParse(url, parseQueryString, slashesDenoteHost) {
	  if (url && isObject(url) && url instanceof Url) return url;

	  var u = new Url;
	  u.parse(url, parseQueryString, slashesDenoteHost);
	  return u;
	}
	Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
	  return parse$1(this, url, parseQueryString, slashesDenoteHost);
	};

	function parse$1(self, url, parseQueryString, slashesDenoteHost) {
	  if (!isString(url)) {
	    throw new TypeError('Parameter \'url\' must be a string, not ' + typeof url);
	  }

	  // Copy chrome, IE, opera backslash-handling behavior.
	  // Back slashes before the query string get converted to forward slashes
	  // See: https://code.google.com/p/chromium/issues/detail?id=25916
	  var queryIndex = url.indexOf('?'),
	    splitter =
	    (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
	    uSplit = url.split(splitter),
	    slashRegex = /\\/g;
	  uSplit[0] = uSplit[0].replace(slashRegex, '/');
	  url = uSplit.join(splitter);

	  var rest = url;

	  // trim before proceeding.
	  // This is to support parse stuff like "  http://foo.com  \n"
	  rest = rest.trim();

	  if (!slashesDenoteHost && url.split('#').length === 1) {
	    // Try fast path regexp
	    var simplePath = simplePathPattern.exec(rest);
	    if (simplePath) {
	      self.path = rest;
	      self.href = rest;
	      self.pathname = simplePath[1];
	      if (simplePath[2]) {
	        self.search = simplePath[2];
	        if (parseQueryString) {
	          self.query = parse(self.search.substr(1));
	        } else {
	          self.query = self.search.substr(1);
	        }
	      } else if (parseQueryString) {
	        self.search = '';
	        self.query = {};
	      }
	      return self;
	    }
	  }

	  var proto = protocolPattern.exec(rest);
	  if (proto) {
	    proto = proto[0];
	    var lowerProto = proto.toLowerCase();
	    self.protocol = lowerProto;
	    rest = rest.substr(proto.length);
	  }

	  // figure out if it's got a host
	  // user@server is *always* interpreted as a hostname, and url
	  // resolution will treat //foo/bar as host=foo,path=bar because that's
	  // how the browser resolves relative URLs.
	  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
	    var slashes = rest.substr(0, 2) === '//';
	    if (slashes && !(proto && hostlessProtocol[proto])) {
	      rest = rest.substr(2);
	      self.slashes = true;
	    }
	  }
	  var i, hec, l, p;
	  if (!hostlessProtocol[proto] &&
	    (slashes || (proto && !slashedProtocol[proto]))) {

	    // there's a hostname.
	    // the first instance of /, ?, ;, or # ends the host.
	    //
	    // If there is an @ in the hostname, then non-host chars *are* allowed
	    // to the left of the last @ sign, unless some host-ending character
	    // comes *before* the @-sign.
	    // URLs are obnoxious.
	    //
	    // ex:
	    // http://a@b@c/ => user:a@b host:c
	    // http://a@b?@c => user:a host:c path:/?@c

	    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
	    // Review our test case against browsers more comprehensively.

	    // find the first instance of any hostEndingChars
	    var hostEnd = -1;
	    for (i = 0; i < hostEndingChars.length; i++) {
	      hec = rest.indexOf(hostEndingChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }

	    // at this point, either we have an explicit point where the
	    // auth portion cannot go past, or the last @ char is the decider.
	    var auth, atSign;
	    if (hostEnd === -1) {
	      // atSign can be anywhere.
	      atSign = rest.lastIndexOf('@');
	    } else {
	      // atSign must be in auth portion.
	      // http://a@b/c@d => host:b auth:a path:/c@d
	      atSign = rest.lastIndexOf('@', hostEnd);
	    }

	    // Now we have a portion which is definitely the auth.
	    // Pull that off.
	    if (atSign !== -1) {
	      auth = rest.slice(0, atSign);
	      rest = rest.slice(atSign + 1);
	      self.auth = decodeURIComponent(auth);
	    }

	    // the host is the remaining to the left of the first non-host char
	    hostEnd = -1;
	    for (i = 0; i < nonHostChars.length; i++) {
	      hec = rest.indexOf(nonHostChars[i]);
	      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
	        hostEnd = hec;
	    }
	    // if we still have not hit it, then the entire thing is a host.
	    if (hostEnd === -1)
	      hostEnd = rest.length;

	    self.host = rest.slice(0, hostEnd);
	    rest = rest.slice(hostEnd);

	    // pull out port.
	    parseHost(self);

	    // we've indicated that there is a hostname,
	    // so even if it's empty, it has to be present.
	    self.hostname = self.hostname || '';

	    // if hostname begins with [ and ends with ]
	    // assume that it's an IPv6 address.
	    var ipv6Hostname = self.hostname[0] === '[' &&
	      self.hostname[self.hostname.length - 1] === ']';

	    // validate a little.
	    if (!ipv6Hostname) {
	      var hostparts = self.hostname.split(/\./);
	      for (i = 0, l = hostparts.length; i < l; i++) {
	        var part = hostparts[i];
	        if (!part) continue;
	        if (!part.match(hostnamePartPattern)) {
	          var newpart = '';
	          for (var j = 0, k = part.length; j < k; j++) {
	            if (part.charCodeAt(j) > 127) {
	              // we replace non-ASCII char with a temporary placeholder
	              // we need this to make sure size of hostname is not
	              // broken by replacing non-ASCII by nothing
	              newpart += 'x';
	            } else {
	              newpart += part[j];
	            }
	          }
	          // we test again with ASCII char only
	          if (!newpart.match(hostnamePartPattern)) {
	            var validParts = hostparts.slice(0, i);
	            var notHost = hostparts.slice(i + 1);
	            var bit = part.match(hostnamePartStart);
	            if (bit) {
	              validParts.push(bit[1]);
	              notHost.unshift(bit[2]);
	            }
	            if (notHost.length) {
	              rest = '/' + notHost.join('.') + rest;
	            }
	            self.hostname = validParts.join('.');
	            break;
	          }
	        }
	      }
	    }

	    if (self.hostname.length > hostnameMaxLen) {
	      self.hostname = '';
	    } else {
	      // hostnames are always lower case.
	      self.hostname = self.hostname.toLowerCase();
	    }

	    if (!ipv6Hostname) {
	      // IDNA Support: Returns a punycoded representation of "domain".
	      // It only converts parts of the domain name that
	      // have non-ASCII characters, i.e. it doesn't matter if
	      // you call it with a domain that already is ASCII-only.
	      self.hostname = toASCII(self.hostname);
	    }

	    p = self.port ? ':' + self.port : '';
	    var h = self.hostname || '';
	    self.host = h + p;
	    self.href += self.host;

	    // strip [ and ] from the hostname
	    // the host field still retains them, though
	    if (ipv6Hostname) {
	      self.hostname = self.hostname.substr(1, self.hostname.length - 2);
	      if (rest[0] !== '/') {
	        rest = '/' + rest;
	      }
	    }
	  }

	  // now rest is set to the post-host stuff.
	  // chop off any delim chars.
	  if (!unsafeProtocol[lowerProto]) {

	    // First, make 100% sure that any "autoEscape" chars get
	    // escaped, even if encodeURIComponent doesn't think they
	    // need to be.
	    for (i = 0, l = autoEscape.length; i < l; i++) {
	      var ae = autoEscape[i];
	      if (rest.indexOf(ae) === -1)
	        continue;
	      var esc = encodeURIComponent(ae);
	      if (esc === ae) {
	        esc = escape(ae);
	      }
	      rest = rest.split(ae).join(esc);
	    }
	  }


	  // chop off from the tail first.
	  var hash = rest.indexOf('#');
	  if (hash !== -1) {
	    // got a fragment string.
	    self.hash = rest.substr(hash);
	    rest = rest.slice(0, hash);
	  }
	  var qm = rest.indexOf('?');
	  if (qm !== -1) {
	    self.search = rest.substr(qm);
	    self.query = rest.substr(qm + 1);
	    if (parseQueryString) {
	      self.query = parse(self.query);
	    }
	    rest = rest.slice(0, qm);
	  } else if (parseQueryString) {
	    // no query string, but parseQueryString still requested
	    self.search = '';
	    self.query = {};
	  }
	  if (rest) self.pathname = rest;
	  if (slashedProtocol[lowerProto] &&
	    self.hostname && !self.pathname) {
	    self.pathname = '/';
	  }

	  //to support http.request
	  if (self.pathname || self.search) {
	    p = self.pathname || '';
	    var s = self.search || '';
	    self.path = p + s;
	  }

	  // finally, reconstruct the href based on what has been validated.
	  self.href = format$1(self);
	  return self;
	}

	// format a parsed object into a url string
	function urlFormat(obj) {
	  // ensure it's an object, and not a string url.
	  // If it's an obj, this is a no-op.
	  // this way, you can call url_format() on strings
	  // to clean up potentially wonky urls.
	  if (isString(obj)) obj = parse$1({}, obj);
	  return format$1(obj);
	}

	function format$1(self) {
	  var auth = self.auth || '';
	  if (auth) {
	    auth = encodeURIComponent(auth);
	    auth = auth.replace(/%3A/i, ':');
	    auth += '@';
	  }

	  var protocol = self.protocol || '',
	    pathname = self.pathname || '',
	    hash = self.hash || '',
	    host = false,
	    query = '';

	  if (self.host) {
	    host = auth + self.host;
	  } else if (self.hostname) {
	    host = auth + (self.hostname.indexOf(':') === -1 ?
	      self.hostname :
	      '[' + this.hostname + ']');
	    if (self.port) {
	      host += ':' + self.port;
	    }
	  }

	  if (self.query &&
	    isObject(self.query) &&
	    Object.keys(self.query).length) {
	    query = stringify(self.query);
	  }

	  var search = self.search || (query && ('?' + query)) || '';

	  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

	  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
	  // unless they had them to begin with.
	  if (self.slashes ||
	    (!protocol || slashedProtocol[protocol]) && host !== false) {
	    host = '//' + (host || '');
	    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
	  } else if (!host) {
	    host = '';
	  }

	  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
	  if (search && search.charAt(0) !== '?') search = '?' + search;

	  pathname = pathname.replace(/[?#]/g, function(match) {
	    return encodeURIComponent(match);
	  });
	  search = search.replace('#', '%23');

	  return protocol + host + pathname + search + hash;
	}

	Url.prototype.format = function() {
	  return format$1(this);
	};

	function urlResolve(source, relative) {
	  return urlParse(source, false, true).resolve(relative);
	}

	Url.prototype.resolve = function(relative) {
	  return this.resolveObject(urlParse(relative, false, true)).format();
	};

	function urlResolveObject(source, relative) {
	  if (!source) return relative;
	  return urlParse(source, false, true).resolveObject(relative);
	}

	Url.prototype.resolveObject = function(relative) {
	  if (isString(relative)) {
	    var rel = new Url();
	    rel.parse(relative, false, true);
	    relative = rel;
	  }

	  var result = new Url();
	  var tkeys = Object.keys(this);
	  for (var tk = 0; tk < tkeys.length; tk++) {
	    var tkey = tkeys[tk];
	    result[tkey] = this[tkey];
	  }

	  // hash is always overridden, no matter what.
	  // even href="" will remove it.
	  result.hash = relative.hash;

	  // if the relative url is empty, then there's nothing left to do here.
	  if (relative.href === '') {
	    result.href = result.format();
	    return result;
	  }

	  // hrefs like //foo/bar always cut to the protocol.
	  if (relative.slashes && !relative.protocol) {
	    // take everything except the protocol from relative
	    var rkeys = Object.keys(relative);
	    for (var rk = 0; rk < rkeys.length; rk++) {
	      var rkey = rkeys[rk];
	      if (rkey !== 'protocol')
	        result[rkey] = relative[rkey];
	    }

	    //urlParse appends trailing / to urls like http://www.example.com
	    if (slashedProtocol[result.protocol] &&
	      result.hostname && !result.pathname) {
	      result.path = result.pathname = '/';
	    }

	    result.href = result.format();
	    return result;
	  }
	  var relPath;
	  if (relative.protocol && relative.protocol !== result.protocol) {
	    // if it's a known url protocol, then changing
	    // the protocol does weird things
	    // first, if it's not file:, then we MUST have a host,
	    // and if there was a path
	    // to begin with, then we MUST have a path.
	    // if it is file:, then the host is dropped,
	    // because that's known to be hostless.
	    // anything else is assumed to be absolute.
	    if (!slashedProtocol[relative.protocol]) {
	      var keys = Object.keys(relative);
	      for (var v = 0; v < keys.length; v++) {
	        var k = keys[v];
	        result[k] = relative[k];
	      }
	      result.href = result.format();
	      return result;
	    }

	    result.protocol = relative.protocol;
	    if (!relative.host && !hostlessProtocol[relative.protocol]) {
	      relPath = (relative.pathname || '').split('/');
	      while (relPath.length && !(relative.host = relPath.shift()));
	      if (!relative.host) relative.host = '';
	      if (!relative.hostname) relative.hostname = '';
	      if (relPath[0] !== '') relPath.unshift('');
	      if (relPath.length < 2) relPath.unshift('');
	      result.pathname = relPath.join('/');
	    } else {
	      result.pathname = relative.pathname;
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    result.host = relative.host || '';
	    result.auth = relative.auth;
	    result.hostname = relative.hostname || relative.host;
	    result.port = relative.port;
	    // to support http.request
	    if (result.pathname || result.search) {
	      var p = result.pathname || '';
	      var s = result.search || '';
	      result.path = p + s;
	    }
	    result.slashes = result.slashes || relative.slashes;
	    result.href = result.format();
	    return result;
	  }

	  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
	    isRelAbs = (
	      relative.host ||
	      relative.pathname && relative.pathname.charAt(0) === '/'
	    ),
	    mustEndAbs = (isRelAbs || isSourceAbs ||
	      (result.host && relative.pathname)),
	    removeAllDots = mustEndAbs,
	    srcPath = result.pathname && result.pathname.split('/') || [],
	    psychotic = result.protocol && !slashedProtocol[result.protocol];
	  relPath = relative.pathname && relative.pathname.split('/') || [];
	  // if the url is a non-slashed url, then relative
	  // links like ../.. should be able
	  // to crawl up to the hostname, as well.  This is strange.
	  // result.protocol has already been set by now.
	  // Later on, put the first path part into the host field.
	  if (psychotic) {
	    result.hostname = '';
	    result.port = null;
	    if (result.host) {
	      if (srcPath[0] === '') srcPath[0] = result.host;
	      else srcPath.unshift(result.host);
	    }
	    result.host = '';
	    if (relative.protocol) {
	      relative.hostname = null;
	      relative.port = null;
	      if (relative.host) {
	        if (relPath[0] === '') relPath[0] = relative.host;
	        else relPath.unshift(relative.host);
	      }
	      relative.host = null;
	    }
	    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
	  }
	  var authInHost;
	  if (isRelAbs) {
	    // it's absolute.
	    result.host = (relative.host || relative.host === '') ?
	      relative.host : result.host;
	    result.hostname = (relative.hostname || relative.hostname === '') ?
	      relative.hostname : result.hostname;
	    result.search = relative.search;
	    result.query = relative.query;
	    srcPath = relPath;
	    // fall through to the dot-handling below.
	  } else if (relPath.length) {
	    // it's relative
	    // throw away the existing file, and take the new path instead.
	    if (!srcPath) srcPath = [];
	    srcPath.pop();
	    srcPath = srcPath.concat(relPath);
	    result.search = relative.search;
	    result.query = relative.query;
	  } else if (!isNullOrUndefined(relative.search)) {
	    // just pull out the search.
	    // like href='?foo'.
	    // Put this after the other two cases because it simplifies the booleans
	    if (psychotic) {
	      result.hostname = result.host = srcPath.shift();
	      //occationaly the auth can get stuck only in host
	      //this especially happens in cases like
	      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	      authInHost = result.host && result.host.indexOf('@') > 0 ?
	        result.host.split('@') : false;
	      if (authInHost) {
	        result.auth = authInHost.shift();
	        result.host = result.hostname = authInHost.shift();
	      }
	    }
	    result.search = relative.search;
	    result.query = relative.query;
	    //to support http.request
	    if (!isNull(result.pathname) || !isNull(result.search)) {
	      result.path = (result.pathname ? result.pathname : '') +
	        (result.search ? result.search : '');
	    }
	    result.href = result.format();
	    return result;
	  }

	  if (!srcPath.length) {
	    // no path at all.  easy.
	    // we've already handled the other stuff above.
	    result.pathname = null;
	    //to support http.request
	    if (result.search) {
	      result.path = '/' + result.search;
	    } else {
	      result.path = null;
	    }
	    result.href = result.format();
	    return result;
	  }

	  // if a url ENDs in . or .., then it must get a trailing slash.
	  // however, if it ends in anything else non-slashy,
	  // then it must NOT get a trailing slash.
	  var last = srcPath.slice(-1)[0];
	  var hasTrailingSlash = (
	    (result.host || relative.host || srcPath.length > 1) &&
	    (last === '.' || last === '..') || last === '');

	  // strip single dots, resolve double dots to parent dir
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = srcPath.length; i >= 0; i--) {
	    last = srcPath[i];
	    if (last === '.') {
	      srcPath.splice(i, 1);
	    } else if (last === '..') {
	      srcPath.splice(i, 1);
	      up++;
	    } else if (up) {
	      srcPath.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (!mustEndAbs && !removeAllDots) {
	    for (; up--; up) {
	      srcPath.unshift('..');
	    }
	  }

	  if (mustEndAbs && srcPath[0] !== '' &&
	    (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
	    srcPath.unshift('');
	  }

	  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
	    srcPath.push('');
	  }

	  var isAbsolute = srcPath[0] === '' ||
	    (srcPath[0] && srcPath[0].charAt(0) === '/');

	  // put the host back
	  if (psychotic) {
	    result.hostname = result.host = isAbsolute ? '' :
	      srcPath.length ? srcPath.shift() : '';
	    //occationaly the auth can get stuck only in host
	    //this especially happens in cases like
	    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
	    authInHost = result.host && result.host.indexOf('@') > 0 ?
	      result.host.split('@') : false;
	    if (authInHost) {
	      result.auth = authInHost.shift();
	      result.host = result.hostname = authInHost.shift();
	    }
	  }

	  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

	  if (mustEndAbs && !isAbsolute) {
	    srcPath.unshift('');
	  }

	  if (!srcPath.length) {
	    result.pathname = null;
	    result.path = null;
	  } else {
	    result.pathname = srcPath.join('/');
	  }

	  //to support request.http
	  if (!isNull(result.pathname) || !isNull(result.search)) {
	    result.path = (result.pathname ? result.pathname : '') +
	      (result.search ? result.search : '');
	  }
	  result.auth = relative.auth || result.auth;
	  result.slashes = result.slashes || relative.slashes;
	  result.href = result.format();
	  return result;
	};

	Url.prototype.parseHost = function() {
	  return parseHost(this);
	};

	function parseHost(self) {
	  var host = self.host;
	  var port = portPattern.exec(host);
	  if (port) {
	    port = port[0];
	    if (port !== ':') {
	      self.port = port.substr(1);
	    }
	    host = host.substr(0, host.length - port.length);
	  }
	  if (host) self.hostname = host;
	}

	var url$1 = /*#__PURE__*/Object.freeze({
		parse: urlParse,
		resolve: urlResolve,
		resolveObject: urlResolveObject,
		format: urlFormat,
		default: url,
		Url: Url
	});

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	var db = {
		"application/1d-interleaved-parityfec": {
		source: "iana"
	},
		"application/3gpdash-qoe-report+xml": {
		source: "iana",
		compressible: true
	},
		"application/3gpp-ims+xml": {
		source: "iana",
		compressible: true
	},
		"application/a2l": {
		source: "iana"
	},
		"application/activemessage": {
		source: "iana"
	},
		"application/activity+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-costmap+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-costmapfilter+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-directory+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-endpointcost+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-endpointcostparams+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-endpointprop+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-endpointpropparams+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-error+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-networkmap+json": {
		source: "iana",
		compressible: true
	},
		"application/alto-networkmapfilter+json": {
		source: "iana",
		compressible: true
	},
		"application/aml": {
		source: "iana"
	},
		"application/andrew-inset": {
		source: "iana",
		extensions: [
			"ez"
		]
	},
		"application/applefile": {
		source: "iana"
	},
		"application/applixware": {
		source: "apache",
		extensions: [
			"aw"
		]
	},
		"application/atf": {
		source: "iana"
	},
		"application/atfx": {
		source: "iana"
	},
		"application/atom+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"atom"
		]
	},
		"application/atomcat+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"atomcat"
		]
	},
		"application/atomdeleted+xml": {
		source: "iana",
		compressible: true
	},
		"application/atomicmail": {
		source: "iana"
	},
		"application/atomsvc+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"atomsvc"
		]
	},
		"application/atxml": {
		source: "iana"
	},
		"application/auth-policy+xml": {
		source: "iana",
		compressible: true
	},
		"application/bacnet-xdd+zip": {
		source: "iana",
		compressible: false
	},
		"application/batch-smtp": {
		source: "iana"
	},
		"application/bdoc": {
		compressible: false,
		extensions: [
			"bdoc"
		]
	},
		"application/beep+xml": {
		source: "iana",
		compressible: true
	},
		"application/calendar+json": {
		source: "iana",
		compressible: true
	},
		"application/calendar+xml": {
		source: "iana",
		compressible: true
	},
		"application/call-completion": {
		source: "iana"
	},
		"application/cals-1840": {
		source: "iana"
	},
		"application/cbor": {
		source: "iana"
	},
		"application/cccex": {
		source: "iana"
	},
		"application/ccmp+xml": {
		source: "iana",
		compressible: true
	},
		"application/ccxml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"ccxml"
		]
	},
		"application/cdfx+xml": {
		source: "iana",
		compressible: true
	},
		"application/cdmi-capability": {
		source: "iana",
		extensions: [
			"cdmia"
		]
	},
		"application/cdmi-container": {
		source: "iana",
		extensions: [
			"cdmic"
		]
	},
		"application/cdmi-domain": {
		source: "iana",
		extensions: [
			"cdmid"
		]
	},
		"application/cdmi-object": {
		source: "iana",
		extensions: [
			"cdmio"
		]
	},
		"application/cdmi-queue": {
		source: "iana",
		extensions: [
			"cdmiq"
		]
	},
		"application/cdni": {
		source: "iana"
	},
		"application/cea": {
		source: "iana"
	},
		"application/cea-2018+xml": {
		source: "iana",
		compressible: true
	},
		"application/cellml+xml": {
		source: "iana",
		compressible: true
	},
		"application/cfw": {
		source: "iana"
	},
		"application/clue_info+xml": {
		source: "iana",
		compressible: true
	},
		"application/cms": {
		source: "iana"
	},
		"application/cnrp+xml": {
		source: "iana",
		compressible: true
	},
		"application/coap-group+json": {
		source: "iana",
		compressible: true
	},
		"application/coap-payload": {
		source: "iana"
	},
		"application/commonground": {
		source: "iana"
	},
		"application/conference-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/cose": {
		source: "iana"
	},
		"application/cose-key": {
		source: "iana"
	},
		"application/cose-key-set": {
		source: "iana"
	},
		"application/cpl+xml": {
		source: "iana",
		compressible: true
	},
		"application/csrattrs": {
		source: "iana"
	},
		"application/csta+xml": {
		source: "iana",
		compressible: true
	},
		"application/cstadata+xml": {
		source: "iana",
		compressible: true
	},
		"application/csvm+json": {
		source: "iana",
		compressible: true
	},
		"application/cu-seeme": {
		source: "apache",
		extensions: [
			"cu"
		]
	},
		"application/cwt": {
		source: "iana"
	},
		"application/cybercash": {
		source: "iana"
	},
		"application/dart": {
		compressible: true
	},
		"application/dash+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mpd"
		]
	},
		"application/dashdelta": {
		source: "iana"
	},
		"application/davmount+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"davmount"
		]
	},
		"application/dca-rft": {
		source: "iana"
	},
		"application/dcd": {
		source: "iana"
	},
		"application/dec-dx": {
		source: "iana"
	},
		"application/dialog-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/dicom": {
		source: "iana"
	},
		"application/dicom+json": {
		source: "iana",
		compressible: true
	},
		"application/dicom+xml": {
		source: "iana",
		compressible: true
	},
		"application/dii": {
		source: "iana"
	},
		"application/dit": {
		source: "iana"
	},
		"application/dns": {
		source: "iana"
	},
		"application/dns+json": {
		source: "iana",
		compressible: true
	},
		"application/docbook+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"dbk"
		]
	},
		"application/dskpp+xml": {
		source: "iana",
		compressible: true
	},
		"application/dssc+der": {
		source: "iana",
		extensions: [
			"dssc"
		]
	},
		"application/dssc+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xdssc"
		]
	},
		"application/dvcs": {
		source: "iana"
	},
		"application/ecmascript": {
		source: "iana",
		compressible: true,
		extensions: [
			"ecma",
			"es"
		]
	},
		"application/edi-consent": {
		source: "iana"
	},
		"application/edi-x12": {
		source: "iana",
		compressible: false
	},
		"application/edifact": {
		source: "iana",
		compressible: false
	},
		"application/efi": {
		source: "iana"
	},
		"application/emergencycalldata.comment+xml": {
		source: "iana",
		compressible: true
	},
		"application/emergencycalldata.control+xml": {
		source: "iana",
		compressible: true
	},
		"application/emergencycalldata.deviceinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/emergencycalldata.ecall.msd": {
		source: "iana"
	},
		"application/emergencycalldata.providerinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/emergencycalldata.serviceinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/emergencycalldata.subscriberinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/emergencycalldata.veds+xml": {
		source: "iana",
		compressible: true
	},
		"application/emma+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"emma"
		]
	},
		"application/emotionml+xml": {
		source: "iana",
		compressible: true
	},
		"application/encaprtp": {
		source: "iana"
	},
		"application/epp+xml": {
		source: "iana",
		compressible: true
	},
		"application/epub+zip": {
		source: "iana",
		compressible: false,
		extensions: [
			"epub"
		]
	},
		"application/eshop": {
		source: "iana"
	},
		"application/exi": {
		source: "iana",
		extensions: [
			"exi"
		]
	},
		"application/fastinfoset": {
		source: "iana"
	},
		"application/fastsoap": {
		source: "iana"
	},
		"application/fdt+xml": {
		source: "iana",
		compressible: true
	},
		"application/fhir+json": {
		source: "iana",
		compressible: true
	},
		"application/fhir+xml": {
		source: "iana",
		compressible: true
	},
		"application/fido.trusted-apps+json": {
		compressible: true
	},
		"application/fits": {
		source: "iana"
	},
		"application/font-sfnt": {
		source: "iana"
	},
		"application/font-tdpfr": {
		source: "iana",
		extensions: [
			"pfr"
		]
	},
		"application/font-woff": {
		source: "iana",
		compressible: false
	},
		"application/framework-attributes+xml": {
		source: "iana",
		compressible: true
	},
		"application/geo+json": {
		source: "iana",
		compressible: true,
		extensions: [
			"geojson"
		]
	},
		"application/geo+json-seq": {
		source: "iana"
	},
		"application/geoxacml+xml": {
		source: "iana",
		compressible: true
	},
		"application/gltf-buffer": {
		source: "iana"
	},
		"application/gml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"gml"
		]
	},
		"application/gpx+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"gpx"
		]
	},
		"application/gxf": {
		source: "apache",
		extensions: [
			"gxf"
		]
	},
		"application/gzip": {
		source: "iana",
		compressible: false,
		extensions: [
			"gz"
		]
	},
		"application/h224": {
		source: "iana"
	},
		"application/held+xml": {
		source: "iana",
		compressible: true
	},
		"application/hjson": {
		extensions: [
			"hjson"
		]
	},
		"application/http": {
		source: "iana"
	},
		"application/hyperstudio": {
		source: "iana",
		extensions: [
			"stk"
		]
	},
		"application/ibe-key-request+xml": {
		source: "iana",
		compressible: true
	},
		"application/ibe-pkg-reply+xml": {
		source: "iana",
		compressible: true
	},
		"application/ibe-pp-data": {
		source: "iana"
	},
		"application/iges": {
		source: "iana"
	},
		"application/im-iscomposing+xml": {
		source: "iana",
		compressible: true
	},
		"application/index": {
		source: "iana"
	},
		"application/index.cmd": {
		source: "iana"
	},
		"application/index.obj": {
		source: "iana"
	},
		"application/index.response": {
		source: "iana"
	},
		"application/index.vnd": {
		source: "iana"
	},
		"application/inkml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"ink",
			"inkml"
		]
	},
		"application/iotp": {
		source: "iana"
	},
		"application/ipfix": {
		source: "iana",
		extensions: [
			"ipfix"
		]
	},
		"application/ipp": {
		source: "iana"
	},
		"application/isup": {
		source: "iana"
	},
		"application/its+xml": {
		source: "iana",
		compressible: true
	},
		"application/java-archive": {
		source: "apache",
		compressible: false,
		extensions: [
			"jar",
			"war",
			"ear"
		]
	},
		"application/java-serialized-object": {
		source: "apache",
		compressible: false,
		extensions: [
			"ser"
		]
	},
		"application/java-vm": {
		source: "apache",
		compressible: false,
		extensions: [
			"class"
		]
	},
		"application/javascript": {
		source: "iana",
		charset: "UTF-8",
		compressible: true,
		extensions: [
			"js",
			"mjs"
		]
	},
		"application/jf2feed+json": {
		source: "iana",
		compressible: true
	},
		"application/jose": {
		source: "iana"
	},
		"application/jose+json": {
		source: "iana",
		compressible: true
	},
		"application/jrd+json": {
		source: "iana",
		compressible: true
	},
		"application/json": {
		source: "iana",
		charset: "UTF-8",
		compressible: true,
		extensions: [
			"json",
			"map"
		]
	},
		"application/json-patch+json": {
		source: "iana",
		compressible: true
	},
		"application/json-seq": {
		source: "iana"
	},
		"application/json5": {
		extensions: [
			"json5"
		]
	},
		"application/jsonml+json": {
		source: "apache",
		compressible: true,
		extensions: [
			"jsonml"
		]
	},
		"application/jwk+json": {
		source: "iana",
		compressible: true
	},
		"application/jwk-set+json": {
		source: "iana",
		compressible: true
	},
		"application/jwt": {
		source: "iana"
	},
		"application/kpml-request+xml": {
		source: "iana",
		compressible: true
	},
		"application/kpml-response+xml": {
		source: "iana",
		compressible: true
	},
		"application/ld+json": {
		source: "iana",
		compressible: true,
		extensions: [
			"jsonld"
		]
	},
		"application/lgr+xml": {
		source: "iana",
		compressible: true
	},
		"application/link-format": {
		source: "iana"
	},
		"application/load-control+xml": {
		source: "iana",
		compressible: true
	},
		"application/lost+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"lostxml"
		]
	},
		"application/lostsync+xml": {
		source: "iana",
		compressible: true
	},
		"application/lxf": {
		source: "iana"
	},
		"application/mac-binhex40": {
		source: "iana",
		extensions: [
			"hqx"
		]
	},
		"application/mac-compactpro": {
		source: "apache",
		extensions: [
			"cpt"
		]
	},
		"application/macwriteii": {
		source: "iana"
	},
		"application/mads+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mads"
		]
	},
		"application/manifest+json": {
		charset: "UTF-8",
		compressible: true,
		extensions: [
			"webmanifest"
		]
	},
		"application/marc": {
		source: "iana",
		extensions: [
			"mrc"
		]
	},
		"application/marcxml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mrcx"
		]
	},
		"application/mathematica": {
		source: "iana",
		extensions: [
			"ma",
			"nb",
			"mb"
		]
	},
		"application/mathml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mathml"
		]
	},
		"application/mathml-content+xml": {
		source: "iana",
		compressible: true
	},
		"application/mathml-presentation+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-associated-procedure-description+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-deregister+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-envelope+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-msk+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-msk-response+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-protection-description+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-reception-report+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-register+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-register-response+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-schedule+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbms-user-service-description+xml": {
		source: "iana",
		compressible: true
	},
		"application/mbox": {
		source: "iana",
		extensions: [
			"mbox"
		]
	},
		"application/media-policy-dataset+xml": {
		source: "iana",
		compressible: true
	},
		"application/media_control+xml": {
		source: "iana",
		compressible: true
	},
		"application/mediaservercontrol+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mscml"
		]
	},
		"application/merge-patch+json": {
		source: "iana",
		compressible: true
	},
		"application/metalink+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"metalink"
		]
	},
		"application/metalink4+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"meta4"
		]
	},
		"application/mets+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mets"
		]
	},
		"application/mf4": {
		source: "iana"
	},
		"application/mikey": {
		source: "iana"
	},
		"application/mmt-usd+xml": {
		source: "iana",
		compressible: true
	},
		"application/mods+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mods"
		]
	},
		"application/moss-keys": {
		source: "iana"
	},
		"application/moss-signature": {
		source: "iana"
	},
		"application/mosskey-data": {
		source: "iana"
	},
		"application/mosskey-request": {
		source: "iana"
	},
		"application/mp21": {
		source: "iana",
		extensions: [
			"m21",
			"mp21"
		]
	},
		"application/mp4": {
		source: "iana",
		extensions: [
			"mp4s",
			"m4p"
		]
	},
		"application/mpeg4-generic": {
		source: "iana"
	},
		"application/mpeg4-iod": {
		source: "iana"
	},
		"application/mpeg4-iod-xmt": {
		source: "iana"
	},
		"application/mrb-consumer+xml": {
		source: "iana",
		compressible: true
	},
		"application/mrb-publish+xml": {
		source: "iana",
		compressible: true
	},
		"application/msc-ivr+xml": {
		source: "iana",
		compressible: true
	},
		"application/msc-mixer+xml": {
		source: "iana",
		compressible: true
	},
		"application/msword": {
		source: "iana",
		compressible: false,
		extensions: [
			"doc",
			"dot"
		]
	},
		"application/mud+json": {
		source: "iana",
		compressible: true
	},
		"application/mxf": {
		source: "iana",
		extensions: [
			"mxf"
		]
	},
		"application/n-quads": {
		source: "iana"
	},
		"application/n-triples": {
		source: "iana"
	},
		"application/nasdata": {
		source: "iana"
	},
		"application/news-checkgroups": {
		source: "iana"
	},
		"application/news-groupinfo": {
		source: "iana"
	},
		"application/news-transmission": {
		source: "iana"
	},
		"application/nlsml+xml": {
		source: "iana",
		compressible: true
	},
		"application/node": {
		source: "iana"
	},
		"application/nss": {
		source: "iana"
	},
		"application/ocsp-request": {
		source: "iana"
	},
		"application/ocsp-response": {
		source: "iana"
	},
		"application/octet-stream": {
		source: "iana",
		compressible: false,
		extensions: [
			"bin",
			"dms",
			"lrf",
			"mar",
			"so",
			"dist",
			"distz",
			"pkg",
			"bpk",
			"dump",
			"elc",
			"deploy",
			"exe",
			"dll",
			"deb",
			"dmg",
			"iso",
			"img",
			"msi",
			"msp",
			"msm",
			"buffer"
		]
	},
		"application/oda": {
		source: "iana",
		extensions: [
			"oda"
		]
	},
		"application/odx": {
		source: "iana"
	},
		"application/oebps-package+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"opf"
		]
	},
		"application/ogg": {
		source: "iana",
		compressible: false,
		extensions: [
			"ogx"
		]
	},
		"application/omdoc+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"omdoc"
		]
	},
		"application/onenote": {
		source: "apache",
		extensions: [
			"onetoc",
			"onetoc2",
			"onetmp",
			"onepkg"
		]
	},
		"application/oxps": {
		source: "iana",
		extensions: [
			"oxps"
		]
	},
		"application/p2p-overlay+xml": {
		source: "iana",
		compressible: true
	},
		"application/parityfec": {
		source: "iana"
	},
		"application/passport": {
		source: "iana"
	},
		"application/patch-ops-error+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xer"
		]
	},
		"application/pdf": {
		source: "iana",
		compressible: false,
		extensions: [
			"pdf"
		]
	},
		"application/pdx": {
		source: "iana"
	},
		"application/pgp-encrypted": {
		source: "iana",
		compressible: false,
		extensions: [
			"pgp"
		]
	},
		"application/pgp-keys": {
		source: "iana"
	},
		"application/pgp-signature": {
		source: "iana",
		extensions: [
			"asc",
			"sig"
		]
	},
		"application/pics-rules": {
		source: "apache",
		extensions: [
			"prf"
		]
	},
		"application/pidf+xml": {
		source: "iana",
		compressible: true
	},
		"application/pidf-diff+xml": {
		source: "iana",
		compressible: true
	},
		"application/pkcs10": {
		source: "iana",
		extensions: [
			"p10"
		]
	},
		"application/pkcs12": {
		source: "iana"
	},
		"application/pkcs7-mime": {
		source: "iana",
		extensions: [
			"p7m",
			"p7c"
		]
	},
		"application/pkcs7-signature": {
		source: "iana",
		extensions: [
			"p7s"
		]
	},
		"application/pkcs8": {
		source: "iana",
		extensions: [
			"p8"
		]
	},
		"application/pkcs8-encrypted": {
		source: "iana"
	},
		"application/pkix-attr-cert": {
		source: "iana",
		extensions: [
			"ac"
		]
	},
		"application/pkix-cert": {
		source: "iana",
		extensions: [
			"cer"
		]
	},
		"application/pkix-crl": {
		source: "iana",
		extensions: [
			"crl"
		]
	},
		"application/pkix-pkipath": {
		source: "iana",
		extensions: [
			"pkipath"
		]
	},
		"application/pkixcmp": {
		source: "iana",
		extensions: [
			"pki"
		]
	},
		"application/pls+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"pls"
		]
	},
		"application/poc-settings+xml": {
		source: "iana",
		compressible: true
	},
		"application/postscript": {
		source: "iana",
		compressible: true,
		extensions: [
			"ai",
			"eps",
			"ps"
		]
	},
		"application/ppsp-tracker+json": {
		source: "iana",
		compressible: true
	},
		"application/problem+json": {
		source: "iana",
		compressible: true
	},
		"application/problem+xml": {
		source: "iana",
		compressible: true
	},
		"application/provenance+xml": {
		source: "iana",
		compressible: true
	},
		"application/prs.alvestrand.titrax-sheet": {
		source: "iana"
	},
		"application/prs.cww": {
		source: "iana",
		extensions: [
			"cww"
		]
	},
		"application/prs.hpub+zip": {
		source: "iana",
		compressible: false
	},
		"application/prs.nprend": {
		source: "iana"
	},
		"application/prs.plucker": {
		source: "iana"
	},
		"application/prs.rdf-xml-crypt": {
		source: "iana"
	},
		"application/prs.xsf+xml": {
		source: "iana",
		compressible: true
	},
		"application/pskc+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"pskcxml"
		]
	},
		"application/qsig": {
		source: "iana"
	},
		"application/raml+yaml": {
		compressible: true,
		extensions: [
			"raml"
		]
	},
		"application/raptorfec": {
		source: "iana"
	},
		"application/rdap+json": {
		source: "iana",
		compressible: true
	},
		"application/rdf+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"rdf",
			"owl"
		]
	},
		"application/reginfo+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"rif"
		]
	},
		"application/relax-ng-compact-syntax": {
		source: "iana",
		extensions: [
			"rnc"
		]
	},
		"application/remote-printing": {
		source: "iana"
	},
		"application/reputon+json": {
		source: "iana",
		compressible: true
	},
		"application/resource-lists+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"rl"
		]
	},
		"application/resource-lists-diff+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"rld"
		]
	},
		"application/rfc+xml": {
		source: "iana",
		compressible: true
	},
		"application/riscos": {
		source: "iana"
	},
		"application/rlmi+xml": {
		source: "iana",
		compressible: true
	},
		"application/rls-services+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"rs"
		]
	},
		"application/route-apd+xml": {
		source: "iana",
		compressible: true
	},
		"application/route-s-tsid+xml": {
		source: "iana",
		compressible: true
	},
		"application/route-usd+xml": {
		source: "iana",
		compressible: true
	},
		"application/rpki-ghostbusters": {
		source: "iana",
		extensions: [
			"gbr"
		]
	},
		"application/rpki-manifest": {
		source: "iana",
		extensions: [
			"mft"
		]
	},
		"application/rpki-publication": {
		source: "iana"
	},
		"application/rpki-roa": {
		source: "iana",
		extensions: [
			"roa"
		]
	},
		"application/rpki-updown": {
		source: "iana"
	},
		"application/rsd+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"rsd"
		]
	},
		"application/rss+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"rss"
		]
	},
		"application/rtf": {
		source: "iana",
		compressible: true,
		extensions: [
			"rtf"
		]
	},
		"application/rtploopback": {
		source: "iana"
	},
		"application/rtx": {
		source: "iana"
	},
		"application/samlassertion+xml": {
		source: "iana",
		compressible: true
	},
		"application/samlmetadata+xml": {
		source: "iana",
		compressible: true
	},
		"application/sbml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"sbml"
		]
	},
		"application/scaip+xml": {
		source: "iana",
		compressible: true
	},
		"application/scim+json": {
		source: "iana",
		compressible: true
	},
		"application/scvp-cv-request": {
		source: "iana",
		extensions: [
			"scq"
		]
	},
		"application/scvp-cv-response": {
		source: "iana",
		extensions: [
			"scs"
		]
	},
		"application/scvp-vp-request": {
		source: "iana",
		extensions: [
			"spq"
		]
	},
		"application/scvp-vp-response": {
		source: "iana",
		extensions: [
			"spp"
		]
	},
		"application/sdp": {
		source: "iana",
		extensions: [
			"sdp"
		]
	},
		"application/secevent+jwt": {
		source: "iana"
	},
		"application/senml+cbor": {
		source: "iana"
	},
		"application/senml+json": {
		source: "iana",
		compressible: true
	},
		"application/senml+xml": {
		source: "iana",
		compressible: true
	},
		"application/senml-exi": {
		source: "iana"
	},
		"application/sensml+cbor": {
		source: "iana"
	},
		"application/sensml+json": {
		source: "iana",
		compressible: true
	},
		"application/sensml+xml": {
		source: "iana",
		compressible: true
	},
		"application/sensml-exi": {
		source: "iana"
	},
		"application/sep+xml": {
		source: "iana",
		compressible: true
	},
		"application/sep-exi": {
		source: "iana"
	},
		"application/session-info": {
		source: "iana"
	},
		"application/set-payment": {
		source: "iana"
	},
		"application/set-payment-initiation": {
		source: "iana",
		extensions: [
			"setpay"
		]
	},
		"application/set-registration": {
		source: "iana"
	},
		"application/set-registration-initiation": {
		source: "iana",
		extensions: [
			"setreg"
		]
	},
		"application/sgml": {
		source: "iana"
	},
		"application/sgml-open-catalog": {
		source: "iana"
	},
		"application/shf+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"shf"
		]
	},
		"application/sieve": {
		source: "iana"
	},
		"application/simple-filter+xml": {
		source: "iana",
		compressible: true
	},
		"application/simple-message-summary": {
		source: "iana"
	},
		"application/simplesymbolcontainer": {
		source: "iana"
	},
		"application/slate": {
		source: "iana"
	},
		"application/smil": {
		source: "iana"
	},
		"application/smil+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"smi",
			"smil"
		]
	},
		"application/smpte336m": {
		source: "iana"
	},
		"application/soap+fastinfoset": {
		source: "iana"
	},
		"application/soap+xml": {
		source: "iana",
		compressible: true
	},
		"application/sparql-query": {
		source: "iana",
		extensions: [
			"rq"
		]
	},
		"application/sparql-results+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"srx"
		]
	},
		"application/spirits-event+xml": {
		source: "iana",
		compressible: true
	},
		"application/sql": {
		source: "iana"
	},
		"application/srgs": {
		source: "iana",
		extensions: [
			"gram"
		]
	},
		"application/srgs+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"grxml"
		]
	},
		"application/sru+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"sru"
		]
	},
		"application/ssdl+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"ssdl"
		]
	},
		"application/ssml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"ssml"
		]
	},
		"application/stix+json": {
		source: "iana",
		compressible: true
	},
		"application/tamp-apex-update": {
		source: "iana"
	},
		"application/tamp-apex-update-confirm": {
		source: "iana"
	},
		"application/tamp-community-update": {
		source: "iana"
	},
		"application/tamp-community-update-confirm": {
		source: "iana"
	},
		"application/tamp-error": {
		source: "iana"
	},
		"application/tamp-sequence-adjust": {
		source: "iana"
	},
		"application/tamp-sequence-adjust-confirm": {
		source: "iana"
	},
		"application/tamp-status-query": {
		source: "iana"
	},
		"application/tamp-status-response": {
		source: "iana"
	},
		"application/tamp-update": {
		source: "iana"
	},
		"application/tamp-update-confirm": {
		source: "iana"
	},
		"application/tar": {
		compressible: true
	},
		"application/taxii+json": {
		source: "iana",
		compressible: true
	},
		"application/tei+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"tei",
			"teicorpus"
		]
	},
		"application/thraud+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"tfi"
		]
	},
		"application/timestamp-query": {
		source: "iana"
	},
		"application/timestamp-reply": {
		source: "iana"
	},
		"application/timestamped-data": {
		source: "iana",
		extensions: [
			"tsd"
		]
	},
		"application/tlsrpt+gzip": {
		source: "iana"
	},
		"application/tlsrpt+json": {
		source: "iana",
		compressible: true
	},
		"application/tnauthlist": {
		source: "iana"
	},
		"application/trickle-ice-sdpfrag": {
		source: "iana"
	},
		"application/trig": {
		source: "iana"
	},
		"application/ttml+xml": {
		source: "iana",
		compressible: true
	},
		"application/tve-trigger": {
		source: "iana"
	},
		"application/ulpfec": {
		source: "iana"
	},
		"application/urc-grpsheet+xml": {
		source: "iana",
		compressible: true
	},
		"application/urc-ressheet+xml": {
		source: "iana",
		compressible: true
	},
		"application/urc-targetdesc+xml": {
		source: "iana",
		compressible: true
	},
		"application/urc-uisocketdesc+xml": {
		source: "iana",
		compressible: true
	},
		"application/vcard+json": {
		source: "iana",
		compressible: true
	},
		"application/vcard+xml": {
		source: "iana",
		compressible: true
	},
		"application/vemmi": {
		source: "iana"
	},
		"application/vividence.scriptfile": {
		source: "apache"
	},
		"application/vnd.1000minds.decision-model+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp-prose+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp-prose-pc3ch+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp-v2x-local-service-information": {
		source: "iana"
	},
		"application/vnd.3gpp.access-transfer-events+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.bsf+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.gmop+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mcdata-payload": {
		source: "iana"
	},
		"application/vnd.3gpp.mcdata-signalling": {
		source: "iana"
	},
		"application/vnd.3gpp.mcptt-affiliation-command+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mcptt-floor-request+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mcptt-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mcptt-location-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mcptt-signed+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.mid-call+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.pic-bw-large": {
		source: "iana",
		extensions: [
			"plb"
		]
	},
		"application/vnd.3gpp.pic-bw-small": {
		source: "iana",
		extensions: [
			"psb"
		]
	},
		"application/vnd.3gpp.pic-bw-var": {
		source: "iana",
		extensions: [
			"pvb"
		]
	},
		"application/vnd.3gpp.sms": {
		source: "iana"
	},
		"application/vnd.3gpp.sms+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.srvcc-ext+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.srvcc-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.state-and-event-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp.ussd+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp2.bcmcsinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.3gpp2.sms": {
		source: "iana"
	},
		"application/vnd.3gpp2.tcap": {
		source: "iana",
		extensions: [
			"tcap"
		]
	},
		"application/vnd.3lightssoftware.imagescal": {
		source: "iana"
	},
		"application/vnd.3m.post-it-notes": {
		source: "iana",
		extensions: [
			"pwn"
		]
	},
		"application/vnd.accpac.simply.aso": {
		source: "iana",
		extensions: [
			"aso"
		]
	},
		"application/vnd.accpac.simply.imp": {
		source: "iana",
		extensions: [
			"imp"
		]
	},
		"application/vnd.acucobol": {
		source: "iana",
		extensions: [
			"acu"
		]
	},
		"application/vnd.acucorp": {
		source: "iana",
		extensions: [
			"atc",
			"acutc"
		]
	},
		"application/vnd.adobe.air-application-installer-package+zip": {
		source: "apache",
		compressible: false,
		extensions: [
			"air"
		]
	},
		"application/vnd.adobe.flash.movie": {
		source: "iana"
	},
		"application/vnd.adobe.formscentral.fcdt": {
		source: "iana",
		extensions: [
			"fcdt"
		]
	},
		"application/vnd.adobe.fxp": {
		source: "iana",
		extensions: [
			"fxp",
			"fxpl"
		]
	},
		"application/vnd.adobe.partial-upload": {
		source: "iana"
	},
		"application/vnd.adobe.xdp+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xdp"
		]
	},
		"application/vnd.adobe.xfdf": {
		source: "iana",
		extensions: [
			"xfdf"
		]
	},
		"application/vnd.aether.imp": {
		source: "iana"
	},
		"application/vnd.afpc.afplinedata": {
		source: "iana"
	},
		"application/vnd.afpc.modca": {
		source: "iana"
	},
		"application/vnd.ah-barcode": {
		source: "iana"
	},
		"application/vnd.ahead.space": {
		source: "iana",
		extensions: [
			"ahead"
		]
	},
		"application/vnd.airzip.filesecure.azf": {
		source: "iana",
		extensions: [
			"azf"
		]
	},
		"application/vnd.airzip.filesecure.azs": {
		source: "iana",
		extensions: [
			"azs"
		]
	},
		"application/vnd.amadeus+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.amazon.ebook": {
		source: "apache",
		extensions: [
			"azw"
		]
	},
		"application/vnd.amazon.mobi8-ebook": {
		source: "iana"
	},
		"application/vnd.americandynamics.acc": {
		source: "iana",
		extensions: [
			"acc"
		]
	},
		"application/vnd.amiga.ami": {
		source: "iana",
		extensions: [
			"ami"
		]
	},
		"application/vnd.amundsen.maze+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.android.package-archive": {
		source: "apache",
		compressible: false,
		extensions: [
			"apk"
		]
	},
		"application/vnd.anki": {
		source: "iana"
	},
		"application/vnd.anser-web-certificate-issue-initiation": {
		source: "iana",
		extensions: [
			"cii"
		]
	},
		"application/vnd.anser-web-funds-transfer-initiation": {
		source: "apache",
		extensions: [
			"fti"
		]
	},
		"application/vnd.antix.game-component": {
		source: "iana",
		extensions: [
			"atx"
		]
	},
		"application/vnd.apache.thrift.binary": {
		source: "iana"
	},
		"application/vnd.apache.thrift.compact": {
		source: "iana"
	},
		"application/vnd.apache.thrift.json": {
		source: "iana"
	},
		"application/vnd.api+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.apothekende.reservation+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.apple.installer+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mpkg"
		]
	},
		"application/vnd.apple.mpegurl": {
		source: "iana",
		extensions: [
			"m3u8"
		]
	},
		"application/vnd.apple.pkpass": {
		compressible: false,
		extensions: [
			"pkpass"
		]
	},
		"application/vnd.arastra.swi": {
		source: "iana"
	},
		"application/vnd.aristanetworks.swi": {
		source: "iana",
		extensions: [
			"swi"
		]
	},
		"application/vnd.artisan+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.artsquare": {
		source: "iana"
	},
		"application/vnd.astraea-software.iota": {
		source: "iana",
		extensions: [
			"iota"
		]
	},
		"application/vnd.audiograph": {
		source: "iana",
		extensions: [
			"aep"
		]
	},
		"application/vnd.autopackage": {
		source: "iana"
	},
		"application/vnd.avalon+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.avistar+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.balsamiq.bmml+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.balsamiq.bmpr": {
		source: "iana"
	},
		"application/vnd.banana-accounting": {
		source: "iana"
	},
		"application/vnd.bbf.usp.msg": {
		source: "iana"
	},
		"application/vnd.bbf.usp.msg+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.bekitzur-stech+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.bint.med-content": {
		source: "iana"
	},
		"application/vnd.biopax.rdf+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.blink-idb-value-wrapper": {
		source: "iana"
	},
		"application/vnd.blueice.multipass": {
		source: "iana",
		extensions: [
			"mpm"
		]
	},
		"application/vnd.bluetooth.ep.oob": {
		source: "iana"
	},
		"application/vnd.bluetooth.le.oob": {
		source: "iana"
	},
		"application/vnd.bmi": {
		source: "iana",
		extensions: [
			"bmi"
		]
	},
		"application/vnd.businessobjects": {
		source: "iana",
		extensions: [
			"rep"
		]
	},
		"application/vnd.byu.uapi+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.cab-jscript": {
		source: "iana"
	},
		"application/vnd.canon-cpdl": {
		source: "iana"
	},
		"application/vnd.canon-lips": {
		source: "iana"
	},
		"application/vnd.capasystems-pg+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.cendio.thinlinc.clientconf": {
		source: "iana"
	},
		"application/vnd.century-systems.tcp_stream": {
		source: "iana"
	},
		"application/vnd.chemdraw+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"cdxml"
		]
	},
		"application/vnd.chess-pgn": {
		source: "iana"
	},
		"application/vnd.chipnuts.karaoke-mmd": {
		source: "iana",
		extensions: [
			"mmd"
		]
	},
		"application/vnd.cinderella": {
		source: "iana",
		extensions: [
			"cdy"
		]
	},
		"application/vnd.cirpack.isdn-ext": {
		source: "iana"
	},
		"application/vnd.citationstyles.style+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"csl"
		]
	},
		"application/vnd.claymore": {
		source: "iana",
		extensions: [
			"cla"
		]
	},
		"application/vnd.cloanto.rp9": {
		source: "iana",
		extensions: [
			"rp9"
		]
	},
		"application/vnd.clonk.c4group": {
		source: "iana",
		extensions: [
			"c4g",
			"c4d",
			"c4f",
			"c4p",
			"c4u"
		]
	},
		"application/vnd.cluetrust.cartomobile-config": {
		source: "iana",
		extensions: [
			"c11amc"
		]
	},
		"application/vnd.cluetrust.cartomobile-config-pkg": {
		source: "iana",
		extensions: [
			"c11amz"
		]
	},
		"application/vnd.coffeescript": {
		source: "iana"
	},
		"application/vnd.collabio.xodocuments.document": {
		source: "iana"
	},
		"application/vnd.collabio.xodocuments.document-template": {
		source: "iana"
	},
		"application/vnd.collabio.xodocuments.presentation": {
		source: "iana"
	},
		"application/vnd.collabio.xodocuments.presentation-template": {
		source: "iana"
	},
		"application/vnd.collabio.xodocuments.spreadsheet": {
		source: "iana"
	},
		"application/vnd.collabio.xodocuments.spreadsheet-template": {
		source: "iana"
	},
		"application/vnd.collection+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.collection.doc+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.collection.next+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.comicbook+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.comicbook-rar": {
		source: "iana"
	},
		"application/vnd.commerce-battelle": {
		source: "iana"
	},
		"application/vnd.commonspace": {
		source: "iana",
		extensions: [
			"csp"
		]
	},
		"application/vnd.contact.cmsg": {
		source: "iana",
		extensions: [
			"cdbcmsg"
		]
	},
		"application/vnd.coreos.ignition+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.cosmocaller": {
		source: "iana",
		extensions: [
			"cmc"
		]
	},
		"application/vnd.crick.clicker": {
		source: "iana",
		extensions: [
			"clkx"
		]
	},
		"application/vnd.crick.clicker.keyboard": {
		source: "iana",
		extensions: [
			"clkk"
		]
	},
		"application/vnd.crick.clicker.palette": {
		source: "iana",
		extensions: [
			"clkp"
		]
	},
		"application/vnd.crick.clicker.template": {
		source: "iana",
		extensions: [
			"clkt"
		]
	},
		"application/vnd.crick.clicker.wordbank": {
		source: "iana",
		extensions: [
			"clkw"
		]
	},
		"application/vnd.criticaltools.wbs+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"wbs"
		]
	},
		"application/vnd.ctc-posml": {
		source: "iana",
		extensions: [
			"pml"
		]
	},
		"application/vnd.ctct.ws+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.cups-pdf": {
		source: "iana"
	},
		"application/vnd.cups-postscript": {
		source: "iana"
	},
		"application/vnd.cups-ppd": {
		source: "iana",
		extensions: [
			"ppd"
		]
	},
		"application/vnd.cups-raster": {
		source: "iana"
	},
		"application/vnd.cups-raw": {
		source: "iana"
	},
		"application/vnd.curl": {
		source: "iana"
	},
		"application/vnd.curl.car": {
		source: "apache",
		extensions: [
			"car"
		]
	},
		"application/vnd.curl.pcurl": {
		source: "apache",
		extensions: [
			"pcurl"
		]
	},
		"application/vnd.cyan.dean.root+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.cybank": {
		source: "iana"
	},
		"application/vnd.d2l.coursepackage1p0+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.dart": {
		source: "iana",
		compressible: true,
		extensions: [
			"dart"
		]
	},
		"application/vnd.data-vision.rdz": {
		source: "iana",
		extensions: [
			"rdz"
		]
	},
		"application/vnd.datapackage+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dataresource+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.debian.binary-package": {
		source: "iana"
	},
		"application/vnd.dece.data": {
		source: "iana",
		extensions: [
			"uvf",
			"uvvf",
			"uvd",
			"uvvd"
		]
	},
		"application/vnd.dece.ttml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"uvt",
			"uvvt"
		]
	},
		"application/vnd.dece.unspecified": {
		source: "iana",
		extensions: [
			"uvx",
			"uvvx"
		]
	},
		"application/vnd.dece.zip": {
		source: "iana",
		extensions: [
			"uvz",
			"uvvz"
		]
	},
		"application/vnd.denovo.fcselayout-link": {
		source: "iana",
		extensions: [
			"fe_launch"
		]
	},
		"application/vnd.desmume-movie": {
		source: "iana"
	},
		"application/vnd.desmume.movie": {
		source: "apache"
	},
		"application/vnd.dir-bi.plate-dl-nosuffix": {
		source: "iana"
	},
		"application/vnd.dm.delegation+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dna": {
		source: "iana",
		extensions: [
			"dna"
		]
	},
		"application/vnd.document+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dolby.mlp": {
		source: "apache",
		extensions: [
			"mlp"
		]
	},
		"application/vnd.dolby.mobile.1": {
		source: "iana"
	},
		"application/vnd.dolby.mobile.2": {
		source: "iana"
	},
		"application/vnd.doremir.scorecloud-binary-document": {
		source: "iana"
	},
		"application/vnd.dpgraph": {
		source: "iana",
		extensions: [
			"dpg"
		]
	},
		"application/vnd.dreamfactory": {
		source: "iana",
		extensions: [
			"dfac"
		]
	},
		"application/vnd.drive+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ds-keypoint": {
		source: "apache",
		extensions: [
			"kpxx"
		]
	},
		"application/vnd.dtg.local": {
		source: "iana"
	},
		"application/vnd.dtg.local.flash": {
		source: "iana"
	},
		"application/vnd.dtg.local.html": {
		source: "iana"
	},
		"application/vnd.dvb.ait": {
		source: "iana",
		extensions: [
			"ait"
		]
	},
		"application/vnd.dvb.dvbj": {
		source: "iana"
	},
		"application/vnd.dvb.esgcontainer": {
		source: "iana"
	},
		"application/vnd.dvb.ipdcdftnotifaccess": {
		source: "iana"
	},
		"application/vnd.dvb.ipdcesgaccess": {
		source: "iana"
	},
		"application/vnd.dvb.ipdcesgaccess2": {
		source: "iana"
	},
		"application/vnd.dvb.ipdcesgpdd": {
		source: "iana"
	},
		"application/vnd.dvb.ipdcroaming": {
		source: "iana"
	},
		"application/vnd.dvb.iptv.alfec-base": {
		source: "iana"
	},
		"application/vnd.dvb.iptv.alfec-enhancement": {
		source: "iana"
	},
		"application/vnd.dvb.notif-aggregate-root+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.notif-container+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.notif-generic+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.notif-ia-msglist+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.notif-ia-registration-request+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.notif-ia-registration-response+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.notif-init+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.dvb.pfr": {
		source: "iana"
	},
		"application/vnd.dvb.service": {
		source: "iana",
		extensions: [
			"svc"
		]
	},
		"application/vnd.dxr": {
		source: "iana"
	},
		"application/vnd.dynageo": {
		source: "iana",
		extensions: [
			"geo"
		]
	},
		"application/vnd.dzr": {
		source: "iana"
	},
		"application/vnd.easykaraoke.cdgdownload": {
		source: "iana"
	},
		"application/vnd.ecdis-update": {
		source: "iana"
	},
		"application/vnd.ecip.rlp": {
		source: "iana"
	},
		"application/vnd.ecowin.chart": {
		source: "iana",
		extensions: [
			"mag"
		]
	},
		"application/vnd.ecowin.filerequest": {
		source: "iana"
	},
		"application/vnd.ecowin.fileupdate": {
		source: "iana"
	},
		"application/vnd.ecowin.series": {
		source: "iana"
	},
		"application/vnd.ecowin.seriesrequest": {
		source: "iana"
	},
		"application/vnd.ecowin.seriesupdate": {
		source: "iana"
	},
		"application/vnd.efi.img": {
		source: "iana"
	},
		"application/vnd.efi.iso": {
		source: "iana"
	},
		"application/vnd.emclient.accessrequest+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.enliven": {
		source: "iana",
		extensions: [
			"nml"
		]
	},
		"application/vnd.enphase.envoy": {
		source: "iana"
	},
		"application/vnd.eprints.data+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.epson.esf": {
		source: "iana",
		extensions: [
			"esf"
		]
	},
		"application/vnd.epson.msf": {
		source: "iana",
		extensions: [
			"msf"
		]
	},
		"application/vnd.epson.quickanime": {
		source: "iana",
		extensions: [
			"qam"
		]
	},
		"application/vnd.epson.salt": {
		source: "iana",
		extensions: [
			"slt"
		]
	},
		"application/vnd.epson.ssf": {
		source: "iana",
		extensions: [
			"ssf"
		]
	},
		"application/vnd.ericsson.quickcall": {
		source: "iana"
	},
		"application/vnd.espass-espass+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.eszigno3+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"es3",
			"et3"
		]
	},
		"application/vnd.etsi.aoc+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.asic-e+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.etsi.asic-s+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.etsi.cug+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvcommand+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvdiscovery+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvprofile+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvsad-bc+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvsad-cod+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvsad-npvr+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvservice+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvsync+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.iptvueprofile+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.mcid+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.mheg5": {
		source: "iana"
	},
		"application/vnd.etsi.overload-control-policy-dataset+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.pstn+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.sci+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.simservs+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.timestamp-token": {
		source: "iana"
	},
		"application/vnd.etsi.tsl+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.etsi.tsl.der": {
		source: "iana"
	},
		"application/vnd.eudora.data": {
		source: "iana"
	},
		"application/vnd.evolv.ecig.profile": {
		source: "iana"
	},
		"application/vnd.evolv.ecig.settings": {
		source: "iana"
	},
		"application/vnd.evolv.ecig.theme": {
		source: "iana"
	},
		"application/vnd.ezpix-album": {
		source: "iana",
		extensions: [
			"ez2"
		]
	},
		"application/vnd.ezpix-package": {
		source: "iana",
		extensions: [
			"ez3"
		]
	},
		"application/vnd.f-secure.mobile": {
		source: "iana"
	},
		"application/vnd.fastcopy-disk-image": {
		source: "iana"
	},
		"application/vnd.fdf": {
		source: "iana",
		extensions: [
			"fdf"
		]
	},
		"application/vnd.fdsn.mseed": {
		source: "iana",
		extensions: [
			"mseed"
		]
	},
		"application/vnd.fdsn.seed": {
		source: "iana",
		extensions: [
			"seed",
			"dataless"
		]
	},
		"application/vnd.ffsns": {
		source: "iana"
	},
		"application/vnd.filmit.zfc": {
		source: "iana"
	},
		"application/vnd.fints": {
		source: "iana"
	},
		"application/vnd.firemonkeys.cloudcell": {
		source: "iana"
	},
		"application/vnd.flographit": {
		source: "iana",
		extensions: [
			"gph"
		]
	},
		"application/vnd.fluxtime.clip": {
		source: "iana",
		extensions: [
			"ftc"
		]
	},
		"application/vnd.font-fontforge-sfd": {
		source: "iana"
	},
		"application/vnd.framemaker": {
		source: "iana",
		extensions: [
			"fm",
			"frame",
			"maker",
			"book"
		]
	},
		"application/vnd.frogans.fnc": {
		source: "iana",
		extensions: [
			"fnc"
		]
	},
		"application/vnd.frogans.ltf": {
		source: "iana",
		extensions: [
			"ltf"
		]
	},
		"application/vnd.fsc.weblaunch": {
		source: "iana",
		extensions: [
			"fsc"
		]
	},
		"application/vnd.fujitsu.oasys": {
		source: "iana",
		extensions: [
			"oas"
		]
	},
		"application/vnd.fujitsu.oasys2": {
		source: "iana",
		extensions: [
			"oa2"
		]
	},
		"application/vnd.fujitsu.oasys3": {
		source: "iana",
		extensions: [
			"oa3"
		]
	},
		"application/vnd.fujitsu.oasysgp": {
		source: "iana",
		extensions: [
			"fg5"
		]
	},
		"application/vnd.fujitsu.oasysprs": {
		source: "iana",
		extensions: [
			"bh2"
		]
	},
		"application/vnd.fujixerox.art-ex": {
		source: "iana"
	},
		"application/vnd.fujixerox.art4": {
		source: "iana"
	},
		"application/vnd.fujixerox.ddd": {
		source: "iana",
		extensions: [
			"ddd"
		]
	},
		"application/vnd.fujixerox.docuworks": {
		source: "iana",
		extensions: [
			"xdw"
		]
	},
		"application/vnd.fujixerox.docuworks.binder": {
		source: "iana",
		extensions: [
			"xbd"
		]
	},
		"application/vnd.fujixerox.docuworks.container": {
		source: "iana"
	},
		"application/vnd.fujixerox.hbpl": {
		source: "iana"
	},
		"application/vnd.fut-misnet": {
		source: "iana"
	},
		"application/vnd.fuzzysheet": {
		source: "iana",
		extensions: [
			"fzs"
		]
	},
		"application/vnd.genomatix.tuxedo": {
		source: "iana",
		extensions: [
			"txd"
		]
	},
		"application/vnd.geo+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.geocube+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.geogebra.file": {
		source: "iana",
		extensions: [
			"ggb"
		]
	},
		"application/vnd.geogebra.tool": {
		source: "iana",
		extensions: [
			"ggt"
		]
	},
		"application/vnd.geometry-explorer": {
		source: "iana",
		extensions: [
			"gex",
			"gre"
		]
	},
		"application/vnd.geonext": {
		source: "iana",
		extensions: [
			"gxt"
		]
	},
		"application/vnd.geoplan": {
		source: "iana",
		extensions: [
			"g2w"
		]
	},
		"application/vnd.geospace": {
		source: "iana",
		extensions: [
			"g3w"
		]
	},
		"application/vnd.gerber": {
		source: "iana"
	},
		"application/vnd.globalplatform.card-content-mgt": {
		source: "iana"
	},
		"application/vnd.globalplatform.card-content-mgt-response": {
		source: "iana"
	},
		"application/vnd.gmx": {
		source: "iana",
		extensions: [
			"gmx"
		]
	},
		"application/vnd.google-apps.document": {
		compressible: false,
		extensions: [
			"gdoc"
		]
	},
		"application/vnd.google-apps.presentation": {
		compressible: false,
		extensions: [
			"gslides"
		]
	},
		"application/vnd.google-apps.spreadsheet": {
		compressible: false,
		extensions: [
			"gsheet"
		]
	},
		"application/vnd.google-earth.kml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"kml"
		]
	},
		"application/vnd.google-earth.kmz": {
		source: "iana",
		compressible: false,
		extensions: [
			"kmz"
		]
	},
		"application/vnd.gov.sk.e-form+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.gov.sk.e-form+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.gov.sk.xmldatacontainer+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.grafeq": {
		source: "iana",
		extensions: [
			"gqf",
			"gqs"
		]
	},
		"application/vnd.gridmp": {
		source: "iana"
	},
		"application/vnd.groove-account": {
		source: "iana",
		extensions: [
			"gac"
		]
	},
		"application/vnd.groove-help": {
		source: "iana",
		extensions: [
			"ghf"
		]
	},
		"application/vnd.groove-identity-message": {
		source: "iana",
		extensions: [
			"gim"
		]
	},
		"application/vnd.groove-injector": {
		source: "iana",
		extensions: [
			"grv"
		]
	},
		"application/vnd.groove-tool-message": {
		source: "iana",
		extensions: [
			"gtm"
		]
	},
		"application/vnd.groove-tool-template": {
		source: "iana",
		extensions: [
			"tpl"
		]
	},
		"application/vnd.groove-vcard": {
		source: "iana",
		extensions: [
			"vcg"
		]
	},
		"application/vnd.hal+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.hal+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"hal"
		]
	},
		"application/vnd.handheld-entertainment+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"zmm"
		]
	},
		"application/vnd.hbci": {
		source: "iana",
		extensions: [
			"hbci"
		]
	},
		"application/vnd.hc+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.hcl-bireports": {
		source: "iana"
	},
		"application/vnd.hdt": {
		source: "iana"
	},
		"application/vnd.heroku+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.hhe.lesson-player": {
		source: "iana",
		extensions: [
			"les"
		]
	},
		"application/vnd.hp-hpgl": {
		source: "iana",
		extensions: [
			"hpgl"
		]
	},
		"application/vnd.hp-hpid": {
		source: "iana",
		extensions: [
			"hpid"
		]
	},
		"application/vnd.hp-hps": {
		source: "iana",
		extensions: [
			"hps"
		]
	},
		"application/vnd.hp-jlyt": {
		source: "iana",
		extensions: [
			"jlt"
		]
	},
		"application/vnd.hp-pcl": {
		source: "iana",
		extensions: [
			"pcl"
		]
	},
		"application/vnd.hp-pclxl": {
		source: "iana",
		extensions: [
			"pclxl"
		]
	},
		"application/vnd.httphone": {
		source: "iana"
	},
		"application/vnd.hydrostatix.sof-data": {
		source: "iana",
		extensions: [
			"sfd-hdstx"
		]
	},
		"application/vnd.hyper+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.hyper-item+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.hyperdrive+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.hzn-3d-crossword": {
		source: "iana"
	},
		"application/vnd.ibm.afplinedata": {
		source: "iana"
	},
		"application/vnd.ibm.electronic-media": {
		source: "iana"
	},
		"application/vnd.ibm.minipay": {
		source: "iana",
		extensions: [
			"mpy"
		]
	},
		"application/vnd.ibm.modcap": {
		source: "iana",
		extensions: [
			"afp",
			"listafp",
			"list3820"
		]
	},
		"application/vnd.ibm.rights-management": {
		source: "iana",
		extensions: [
			"irm"
		]
	},
		"application/vnd.ibm.secure-container": {
		source: "iana",
		extensions: [
			"sc"
		]
	},
		"application/vnd.iccprofile": {
		source: "iana",
		extensions: [
			"icc",
			"icm"
		]
	},
		"application/vnd.ieee.1905": {
		source: "iana"
	},
		"application/vnd.igloader": {
		source: "iana",
		extensions: [
			"igl"
		]
	},
		"application/vnd.imagemeter.folder+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.imagemeter.image+zip": {
		source: "iana",
		compressible: false
	},
		"application/vnd.immervision-ivp": {
		source: "iana",
		extensions: [
			"ivp"
		]
	},
		"application/vnd.immervision-ivu": {
		source: "iana",
		extensions: [
			"ivu"
		]
	},
		"application/vnd.ims.imsccv1p1": {
		source: "iana"
	},
		"application/vnd.ims.imsccv1p2": {
		source: "iana"
	},
		"application/vnd.ims.imsccv1p3": {
		source: "iana"
	},
		"application/vnd.ims.lis.v2.result+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ims.lti.v2.toolconsumerprofile+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ims.lti.v2.toolproxy+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ims.lti.v2.toolproxy.id+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ims.lti.v2.toolsettings+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ims.lti.v2.toolsettings.simple+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.informedcontrol.rms+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.informix-visionary": {
		source: "iana"
	},
		"application/vnd.infotech.project": {
		source: "iana"
	},
		"application/vnd.infotech.project+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.innopath.wamp.notification": {
		source: "iana"
	},
		"application/vnd.insors.igm": {
		source: "iana",
		extensions: [
			"igm"
		]
	},
		"application/vnd.intercon.formnet": {
		source: "iana",
		extensions: [
			"xpw",
			"xpx"
		]
	},
		"application/vnd.intergeo": {
		source: "iana",
		extensions: [
			"i2g"
		]
	},
		"application/vnd.intertrust.digibox": {
		source: "iana"
	},
		"application/vnd.intertrust.nncp": {
		source: "iana"
	},
		"application/vnd.intu.qbo": {
		source: "iana",
		extensions: [
			"qbo"
		]
	},
		"application/vnd.intu.qfx": {
		source: "iana",
		extensions: [
			"qfx"
		]
	},
		"application/vnd.iptc.g2.catalogitem+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.iptc.g2.conceptitem+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.iptc.g2.knowledgeitem+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.iptc.g2.newsitem+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.iptc.g2.newsmessage+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.iptc.g2.packageitem+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.iptc.g2.planningitem+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ipunplugged.rcprofile": {
		source: "iana",
		extensions: [
			"rcprofile"
		]
	},
		"application/vnd.irepository.package+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"irp"
		]
	},
		"application/vnd.is-xpr": {
		source: "iana",
		extensions: [
			"xpr"
		]
	},
		"application/vnd.isac.fcs": {
		source: "iana",
		extensions: [
			"fcs"
		]
	},
		"application/vnd.jam": {
		source: "iana",
		extensions: [
			"jam"
		]
	},
		"application/vnd.japannet-directory-service": {
		source: "iana"
	},
		"application/vnd.japannet-jpnstore-wakeup": {
		source: "iana"
	},
		"application/vnd.japannet-payment-wakeup": {
		source: "iana"
	},
		"application/vnd.japannet-registration": {
		source: "iana"
	},
		"application/vnd.japannet-registration-wakeup": {
		source: "iana"
	},
		"application/vnd.japannet-setstore-wakeup": {
		source: "iana"
	},
		"application/vnd.japannet-verification": {
		source: "iana"
	},
		"application/vnd.japannet-verification-wakeup": {
		source: "iana"
	},
		"application/vnd.jcp.javame.midlet-rms": {
		source: "iana",
		extensions: [
			"rms"
		]
	},
		"application/vnd.jisp": {
		source: "iana",
		extensions: [
			"jisp"
		]
	},
		"application/vnd.joost.joda-archive": {
		source: "iana",
		extensions: [
			"joda"
		]
	},
		"application/vnd.jsk.isdn-ngn": {
		source: "iana"
	},
		"application/vnd.kahootz": {
		source: "iana",
		extensions: [
			"ktz",
			"ktr"
		]
	},
		"application/vnd.kde.karbon": {
		source: "iana",
		extensions: [
			"karbon"
		]
	},
		"application/vnd.kde.kchart": {
		source: "iana",
		extensions: [
			"chrt"
		]
	},
		"application/vnd.kde.kformula": {
		source: "iana",
		extensions: [
			"kfo"
		]
	},
		"application/vnd.kde.kivio": {
		source: "iana",
		extensions: [
			"flw"
		]
	},
		"application/vnd.kde.kontour": {
		source: "iana",
		extensions: [
			"kon"
		]
	},
		"application/vnd.kde.kpresenter": {
		source: "iana",
		extensions: [
			"kpr",
			"kpt"
		]
	},
		"application/vnd.kde.kspread": {
		source: "iana",
		extensions: [
			"ksp"
		]
	},
		"application/vnd.kde.kword": {
		source: "iana",
		extensions: [
			"kwd",
			"kwt"
		]
	},
		"application/vnd.kenameaapp": {
		source: "iana",
		extensions: [
			"htke"
		]
	},
		"application/vnd.kidspiration": {
		source: "iana",
		extensions: [
			"kia"
		]
	},
		"application/vnd.kinar": {
		source: "iana",
		extensions: [
			"kne",
			"knp"
		]
	},
		"application/vnd.koan": {
		source: "iana",
		extensions: [
			"skp",
			"skd",
			"skt",
			"skm"
		]
	},
		"application/vnd.kodak-descriptor": {
		source: "iana",
		extensions: [
			"sse"
		]
	},
		"application/vnd.las.las+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.las.las+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"lasxml"
		]
	},
		"application/vnd.leap+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.liberty-request+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.llamagraphics.life-balance.desktop": {
		source: "iana",
		extensions: [
			"lbd"
		]
	},
		"application/vnd.llamagraphics.life-balance.exchange+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"lbe"
		]
	},
		"application/vnd.lotus-1-2-3": {
		source: "iana",
		extensions: [
			"123"
		]
	},
		"application/vnd.lotus-approach": {
		source: "iana",
		extensions: [
			"apr"
		]
	},
		"application/vnd.lotus-freelance": {
		source: "iana",
		extensions: [
			"pre"
		]
	},
		"application/vnd.lotus-notes": {
		source: "iana",
		extensions: [
			"nsf"
		]
	},
		"application/vnd.lotus-organizer": {
		source: "iana",
		extensions: [
			"org"
		]
	},
		"application/vnd.lotus-screencam": {
		source: "iana",
		extensions: [
			"scm"
		]
	},
		"application/vnd.lotus-wordpro": {
		source: "iana",
		extensions: [
			"lwp"
		]
	},
		"application/vnd.macports.portpkg": {
		source: "iana",
		extensions: [
			"portpkg"
		]
	},
		"application/vnd.mapbox-vector-tile": {
		source: "iana"
	},
		"application/vnd.marlin.drm.actiontoken+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.marlin.drm.conftoken+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.marlin.drm.license+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.marlin.drm.mdcf": {
		source: "iana"
	},
		"application/vnd.mason+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.maxmind.maxmind-db": {
		source: "iana"
	},
		"application/vnd.mcd": {
		source: "iana",
		extensions: [
			"mcd"
		]
	},
		"application/vnd.medcalcdata": {
		source: "iana",
		extensions: [
			"mc1"
		]
	},
		"application/vnd.mediastation.cdkey": {
		source: "iana",
		extensions: [
			"cdkey"
		]
	},
		"application/vnd.meridian-slingshot": {
		source: "iana"
	},
		"application/vnd.mfer": {
		source: "iana",
		extensions: [
			"mwf"
		]
	},
		"application/vnd.mfmp": {
		source: "iana",
		extensions: [
			"mfm"
		]
	},
		"application/vnd.micro+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.micrografx.flo": {
		source: "iana",
		extensions: [
			"flo"
		]
	},
		"application/vnd.micrografx.igx": {
		source: "iana",
		extensions: [
			"igx"
		]
	},
		"application/vnd.microsoft.portable-executable": {
		source: "iana"
	},
		"application/vnd.microsoft.windows.thumbnail-cache": {
		source: "iana"
	},
		"application/vnd.miele+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.mif": {
		source: "iana",
		extensions: [
			"mif"
		]
	},
		"application/vnd.minisoft-hp3000-save": {
		source: "iana"
	},
		"application/vnd.mitsubishi.misty-guard.trustweb": {
		source: "iana"
	},
		"application/vnd.mobius.daf": {
		source: "iana",
		extensions: [
			"daf"
		]
	},
		"application/vnd.mobius.dis": {
		source: "iana",
		extensions: [
			"dis"
		]
	},
		"application/vnd.mobius.mbk": {
		source: "iana",
		extensions: [
			"mbk"
		]
	},
		"application/vnd.mobius.mqy": {
		source: "iana",
		extensions: [
			"mqy"
		]
	},
		"application/vnd.mobius.msl": {
		source: "iana",
		extensions: [
			"msl"
		]
	},
		"application/vnd.mobius.plc": {
		source: "iana",
		extensions: [
			"plc"
		]
	},
		"application/vnd.mobius.txf": {
		source: "iana",
		extensions: [
			"txf"
		]
	},
		"application/vnd.mophun.application": {
		source: "iana",
		extensions: [
			"mpn"
		]
	},
		"application/vnd.mophun.certificate": {
		source: "iana",
		extensions: [
			"mpc"
		]
	},
		"application/vnd.motorola.flexsuite": {
		source: "iana"
	},
		"application/vnd.motorola.flexsuite.adsi": {
		source: "iana"
	},
		"application/vnd.motorola.flexsuite.fis": {
		source: "iana"
	},
		"application/vnd.motorola.flexsuite.gotap": {
		source: "iana"
	},
		"application/vnd.motorola.flexsuite.kmr": {
		source: "iana"
	},
		"application/vnd.motorola.flexsuite.ttc": {
		source: "iana"
	},
		"application/vnd.motorola.flexsuite.wem": {
		source: "iana"
	},
		"application/vnd.motorola.iprm": {
		source: "iana"
	},
		"application/vnd.mozilla.xul+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xul"
		]
	},
		"application/vnd.ms-3mfdocument": {
		source: "iana"
	},
		"application/vnd.ms-artgalry": {
		source: "iana",
		extensions: [
			"cil"
		]
	},
		"application/vnd.ms-asf": {
		source: "iana"
	},
		"application/vnd.ms-cab-compressed": {
		source: "iana",
		extensions: [
			"cab"
		]
	},
		"application/vnd.ms-color.iccprofile": {
		source: "apache"
	},
		"application/vnd.ms-excel": {
		source: "iana",
		compressible: false,
		extensions: [
			"xls",
			"xlm",
			"xla",
			"xlc",
			"xlt",
			"xlw"
		]
	},
		"application/vnd.ms-excel.addin.macroenabled.12": {
		source: "iana",
		extensions: [
			"xlam"
		]
	},
		"application/vnd.ms-excel.sheet.binary.macroenabled.12": {
		source: "iana",
		extensions: [
			"xlsb"
		]
	},
		"application/vnd.ms-excel.sheet.macroenabled.12": {
		source: "iana",
		extensions: [
			"xlsm"
		]
	},
		"application/vnd.ms-excel.template.macroenabled.12": {
		source: "iana",
		extensions: [
			"xltm"
		]
	},
		"application/vnd.ms-fontobject": {
		source: "iana",
		compressible: true,
		extensions: [
			"eot"
		]
	},
		"application/vnd.ms-htmlhelp": {
		source: "iana",
		extensions: [
			"chm"
		]
	},
		"application/vnd.ms-ims": {
		source: "iana",
		extensions: [
			"ims"
		]
	},
		"application/vnd.ms-lrm": {
		source: "iana",
		extensions: [
			"lrm"
		]
	},
		"application/vnd.ms-office.activex+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ms-officetheme": {
		source: "iana",
		extensions: [
			"thmx"
		]
	},
		"application/vnd.ms-opentype": {
		source: "apache",
		compressible: true
	},
		"application/vnd.ms-outlook": {
		compressible: false,
		extensions: [
			"msg"
		]
	},
		"application/vnd.ms-package.obfuscated-opentype": {
		source: "apache"
	},
		"application/vnd.ms-pki.seccat": {
		source: "apache",
		extensions: [
			"cat"
		]
	},
		"application/vnd.ms-pki.stl": {
		source: "apache",
		extensions: [
			"stl"
		]
	},
		"application/vnd.ms-playready.initiator+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ms-powerpoint": {
		source: "iana",
		compressible: false,
		extensions: [
			"ppt",
			"pps",
			"pot"
		]
	},
		"application/vnd.ms-powerpoint.addin.macroenabled.12": {
		source: "iana",
		extensions: [
			"ppam"
		]
	},
		"application/vnd.ms-powerpoint.presentation.macroenabled.12": {
		source: "iana",
		extensions: [
			"pptm"
		]
	},
		"application/vnd.ms-powerpoint.slide.macroenabled.12": {
		source: "iana",
		extensions: [
			"sldm"
		]
	},
		"application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
		source: "iana",
		extensions: [
			"ppsm"
		]
	},
		"application/vnd.ms-powerpoint.template.macroenabled.12": {
		source: "iana",
		extensions: [
			"potm"
		]
	},
		"application/vnd.ms-printdevicecapabilities+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ms-printing.printticket+xml": {
		source: "apache",
		compressible: true
	},
		"application/vnd.ms-printschematicket+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.ms-project": {
		source: "iana",
		extensions: [
			"mpp",
			"mpt"
		]
	},
		"application/vnd.ms-tnef": {
		source: "iana"
	},
		"application/vnd.ms-windows.devicepairing": {
		source: "iana"
	},
		"application/vnd.ms-windows.nwprinting.oob": {
		source: "iana"
	},
		"application/vnd.ms-windows.printerpairing": {
		source: "iana"
	},
		"application/vnd.ms-windows.wsd.oob": {
		source: "iana"
	},
		"application/vnd.ms-wmdrm.lic-chlg-req": {
		source: "iana"
	},
		"application/vnd.ms-wmdrm.lic-resp": {
		source: "iana"
	},
		"application/vnd.ms-wmdrm.meter-chlg-req": {
		source: "iana"
	},
		"application/vnd.ms-wmdrm.meter-resp": {
		source: "iana"
	},
		"application/vnd.ms-word.document.macroenabled.12": {
		source: "iana",
		extensions: [
			"docm"
		]
	},
		"application/vnd.ms-word.template.macroenabled.12": {
		source: "iana",
		extensions: [
			"dotm"
		]
	},
		"application/vnd.ms-works": {
		source: "iana",
		extensions: [
			"wps",
			"wks",
			"wcm",
			"wdb"
		]
	},
		"application/vnd.ms-wpl": {
		source: "iana",
		extensions: [
			"wpl"
		]
	},
		"application/vnd.ms-xpsdocument": {
		source: "iana",
		compressible: false,
		extensions: [
			"xps"
		]
	},
		"application/vnd.msa-disk-image": {
		source: "iana"
	},
		"application/vnd.mseq": {
		source: "iana",
		extensions: [
			"mseq"
		]
	},
		"application/vnd.msign": {
		source: "iana"
	},
		"application/vnd.multiad.creator": {
		source: "iana"
	},
		"application/vnd.multiad.creator.cif": {
		source: "iana"
	},
		"application/vnd.music-niff": {
		source: "iana"
	},
		"application/vnd.musician": {
		source: "iana",
		extensions: [
			"mus"
		]
	},
		"application/vnd.muvee.style": {
		source: "iana",
		extensions: [
			"msty"
		]
	},
		"application/vnd.mynfc": {
		source: "iana",
		extensions: [
			"taglet"
		]
	},
		"application/vnd.ncd.control": {
		source: "iana"
	},
		"application/vnd.ncd.reference": {
		source: "iana"
	},
		"application/vnd.nearst.inv+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nervana": {
		source: "iana"
	},
		"application/vnd.netfpx": {
		source: "iana"
	},
		"application/vnd.neurolanguage.nlu": {
		source: "iana",
		extensions: [
			"nlu"
		]
	},
		"application/vnd.nimn": {
		source: "iana"
	},
		"application/vnd.nintendo.nitro.rom": {
		source: "iana"
	},
		"application/vnd.nintendo.snes.rom": {
		source: "iana"
	},
		"application/vnd.nitf": {
		source: "iana",
		extensions: [
			"ntf",
			"nitf"
		]
	},
		"application/vnd.noblenet-directory": {
		source: "iana",
		extensions: [
			"nnd"
		]
	},
		"application/vnd.noblenet-sealer": {
		source: "iana",
		extensions: [
			"nns"
		]
	},
		"application/vnd.noblenet-web": {
		source: "iana",
		extensions: [
			"nnw"
		]
	},
		"application/vnd.nokia.catalogs": {
		source: "iana"
	},
		"application/vnd.nokia.conml+wbxml": {
		source: "iana"
	},
		"application/vnd.nokia.conml+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nokia.iptv.config+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nokia.isds-radio-presets": {
		source: "iana"
	},
		"application/vnd.nokia.landmark+wbxml": {
		source: "iana"
	},
		"application/vnd.nokia.landmark+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nokia.landmarkcollection+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nokia.n-gage.ac+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nokia.n-gage.data": {
		source: "iana",
		extensions: [
			"ngdat"
		]
	},
		"application/vnd.nokia.n-gage.symbian.install": {
		source: "iana",
		extensions: [
			"n-gage"
		]
	},
		"application/vnd.nokia.ncd": {
		source: "iana"
	},
		"application/vnd.nokia.pcd+wbxml": {
		source: "iana"
	},
		"application/vnd.nokia.pcd+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.nokia.radio-preset": {
		source: "iana",
		extensions: [
			"rpst"
		]
	},
		"application/vnd.nokia.radio-presets": {
		source: "iana",
		extensions: [
			"rpss"
		]
	},
		"application/vnd.novadigm.edm": {
		source: "iana",
		extensions: [
			"edm"
		]
	},
		"application/vnd.novadigm.edx": {
		source: "iana",
		extensions: [
			"edx"
		]
	},
		"application/vnd.novadigm.ext": {
		source: "iana",
		extensions: [
			"ext"
		]
	},
		"application/vnd.ntt-local.content-share": {
		source: "iana"
	},
		"application/vnd.ntt-local.file-transfer": {
		source: "iana"
	},
		"application/vnd.ntt-local.ogw_remote-access": {
		source: "iana"
	},
		"application/vnd.ntt-local.sip-ta_remote": {
		source: "iana"
	},
		"application/vnd.ntt-local.sip-ta_tcp_stream": {
		source: "iana"
	},
		"application/vnd.oasis.opendocument.chart": {
		source: "iana",
		extensions: [
			"odc"
		]
	},
		"application/vnd.oasis.opendocument.chart-template": {
		source: "iana",
		extensions: [
			"otc"
		]
	},
		"application/vnd.oasis.opendocument.database": {
		source: "iana",
		extensions: [
			"odb"
		]
	},
		"application/vnd.oasis.opendocument.formula": {
		source: "iana",
		extensions: [
			"odf"
		]
	},
		"application/vnd.oasis.opendocument.formula-template": {
		source: "iana",
		extensions: [
			"odft"
		]
	},
		"application/vnd.oasis.opendocument.graphics": {
		source: "iana",
		compressible: false,
		extensions: [
			"odg"
		]
	},
		"application/vnd.oasis.opendocument.graphics-template": {
		source: "iana",
		extensions: [
			"otg"
		]
	},
		"application/vnd.oasis.opendocument.image": {
		source: "iana",
		extensions: [
			"odi"
		]
	},
		"application/vnd.oasis.opendocument.image-template": {
		source: "iana",
		extensions: [
			"oti"
		]
	},
		"application/vnd.oasis.opendocument.presentation": {
		source: "iana",
		compressible: false,
		extensions: [
			"odp"
		]
	},
		"application/vnd.oasis.opendocument.presentation-template": {
		source: "iana",
		extensions: [
			"otp"
		]
	},
		"application/vnd.oasis.opendocument.spreadsheet": {
		source: "iana",
		compressible: false,
		extensions: [
			"ods"
		]
	},
		"application/vnd.oasis.opendocument.spreadsheet-template": {
		source: "iana",
		extensions: [
			"ots"
		]
	},
		"application/vnd.oasis.opendocument.text": {
		source: "iana",
		compressible: false,
		extensions: [
			"odt"
		]
	},
		"application/vnd.oasis.opendocument.text-master": {
		source: "iana",
		extensions: [
			"odm"
		]
	},
		"application/vnd.oasis.opendocument.text-template": {
		source: "iana",
		extensions: [
			"ott"
		]
	},
		"application/vnd.oasis.opendocument.text-web": {
		source: "iana",
		extensions: [
			"oth"
		]
	},
		"application/vnd.obn": {
		source: "iana"
	},
		"application/vnd.ocf+cbor": {
		source: "iana"
	},
		"application/vnd.oftn.l10n+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.contentaccessdownload+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.contentaccessstreaming+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.cspg-hexbinary": {
		source: "iana"
	},
		"application/vnd.oipf.dae.svg+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.dae.xhtml+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.mippvcontrolmessage+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.pae.gem": {
		source: "iana"
	},
		"application/vnd.oipf.spdiscovery+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.spdlist+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.ueprofile+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oipf.userprofile+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.olpc-sugar": {
		source: "iana",
		extensions: [
			"xo"
		]
	},
		"application/vnd.oma-scws-config": {
		source: "iana"
	},
		"application/vnd.oma-scws-http-request": {
		source: "iana"
	},
		"application/vnd.oma-scws-http-response": {
		source: "iana"
	},
		"application/vnd.oma.bcast.associated-procedure-parameter+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.drm-trigger+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.imd+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.ltkm": {
		source: "iana"
	},
		"application/vnd.oma.bcast.notification+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.provisioningtrigger": {
		source: "iana"
	},
		"application/vnd.oma.bcast.sgboot": {
		source: "iana"
	},
		"application/vnd.oma.bcast.sgdd+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.sgdu": {
		source: "iana"
	},
		"application/vnd.oma.bcast.simple-symbol-container": {
		source: "iana"
	},
		"application/vnd.oma.bcast.smartcard-trigger+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.sprov+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.bcast.stkm": {
		source: "iana"
	},
		"application/vnd.oma.cab-address-book+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.cab-feature-handler+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.cab-pcc+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.cab-subs-invite+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.cab-user-prefs+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.dcd": {
		source: "iana"
	},
		"application/vnd.oma.dcdc": {
		source: "iana"
	},
		"application/vnd.oma.dd2+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"dd2"
		]
	},
		"application/vnd.oma.drm.risd+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.group-usage-list+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.lwm2m+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.lwm2m+tlv": {
		source: "iana"
	},
		"application/vnd.oma.pal+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.poc.detailed-progress-report+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.poc.final-report+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.poc.groups+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.poc.invocation-descriptor+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.poc.optimized-progress-report+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.push": {
		source: "iana"
	},
		"application/vnd.oma.scidm.messages+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oma.xcap-directory+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.omads-email+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.omads-file+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.omads-folder+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.omaloc-supl-init": {
		source: "iana"
	},
		"application/vnd.onepager": {
		source: "iana"
	},
		"application/vnd.onepagertamp": {
		source: "iana"
	},
		"application/vnd.onepagertamx": {
		source: "iana"
	},
		"application/vnd.onepagertat": {
		source: "iana"
	},
		"application/vnd.onepagertatp": {
		source: "iana"
	},
		"application/vnd.onepagertatx": {
		source: "iana"
	},
		"application/vnd.openblox.game+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openblox.game-binary": {
		source: "iana"
	},
		"application/vnd.openeye.oeb": {
		source: "iana"
	},
		"application/vnd.openofficeorg.extension": {
		source: "apache",
		extensions: [
			"oxt"
		]
	},
		"application/vnd.openstreetmap.data+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.custom-properties+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawing+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.extended-properties+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": {
		source: "iana",
		compressible: false,
		extensions: [
			"pptx"
		]
	},
		"application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slide": {
		source: "iana",
		extensions: [
			"sldx"
		]
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
		source: "iana",
		extensions: [
			"ppsx"
		]
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.template": {
		source: "iana",
		extensions: [
			"potx"
		]
	},
		"application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
		source: "iana",
		compressible: false,
		extensions: [
			"xlsx"
		]
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
		source: "iana",
		extensions: [
			"xltx"
		]
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.theme+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.themeoverride+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.vmldrawing": {
		source: "iana"
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
		source: "iana",
		compressible: false,
		extensions: [
			"docx"
		]
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
		source: "iana",
		extensions: [
			"dotx"
		]
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-package.core-properties+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.openxmlformats-package.relationships+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oracle.resource+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.orange.indata": {
		source: "iana"
	},
		"application/vnd.osa.netdeploy": {
		source: "iana"
	},
		"application/vnd.osgeo.mapguide.package": {
		source: "iana",
		extensions: [
			"mgp"
		]
	},
		"application/vnd.osgi.bundle": {
		source: "iana"
	},
		"application/vnd.osgi.dp": {
		source: "iana",
		extensions: [
			"dp"
		]
	},
		"application/vnd.osgi.subsystem": {
		source: "iana",
		extensions: [
			"esa"
		]
	},
		"application/vnd.otps.ct-kip+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.oxli.countgraph": {
		source: "iana"
	},
		"application/vnd.pagerduty+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.palm": {
		source: "iana",
		extensions: [
			"pdb",
			"pqa",
			"oprc"
		]
	},
		"application/vnd.panoply": {
		source: "iana"
	},
		"application/vnd.paos+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.paos.xml": {
		source: "apache"
	},
		"application/vnd.patentdive": {
		source: "iana"
	},
		"application/vnd.pawaafile": {
		source: "iana",
		extensions: [
			"paw"
		]
	},
		"application/vnd.pcos": {
		source: "iana"
	},
		"application/vnd.pg.format": {
		source: "iana",
		extensions: [
			"str"
		]
	},
		"application/vnd.pg.osasli": {
		source: "iana",
		extensions: [
			"ei6"
		]
	},
		"application/vnd.piaccess.application-licence": {
		source: "iana"
	},
		"application/vnd.picsel": {
		source: "iana",
		extensions: [
			"efif"
		]
	},
		"application/vnd.pmi.widget": {
		source: "iana",
		extensions: [
			"wg"
		]
	},
		"application/vnd.poc.group-advertisement+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.pocketlearn": {
		source: "iana",
		extensions: [
			"plf"
		]
	},
		"application/vnd.powerbuilder6": {
		source: "iana",
		extensions: [
			"pbd"
		]
	},
		"application/vnd.powerbuilder6-s": {
		source: "iana"
	},
		"application/vnd.powerbuilder7": {
		source: "iana"
	},
		"application/vnd.powerbuilder7-s": {
		source: "iana"
	},
		"application/vnd.powerbuilder75": {
		source: "iana"
	},
		"application/vnd.powerbuilder75-s": {
		source: "iana"
	},
		"application/vnd.preminet": {
		source: "iana"
	},
		"application/vnd.previewsystems.box": {
		source: "iana",
		extensions: [
			"box"
		]
	},
		"application/vnd.proteus.magazine": {
		source: "iana",
		extensions: [
			"mgz"
		]
	},
		"application/vnd.psfs": {
		source: "iana"
	},
		"application/vnd.publishare-delta-tree": {
		source: "iana",
		extensions: [
			"qps"
		]
	},
		"application/vnd.pvi.ptid1": {
		source: "iana",
		extensions: [
			"ptid"
		]
	},
		"application/vnd.pwg-multiplexed": {
		source: "iana"
	},
		"application/vnd.pwg-xhtml-print+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.qualcomm.brew-app-res": {
		source: "iana"
	},
		"application/vnd.quarantainenet": {
		source: "iana"
	},
		"application/vnd.quark.quarkxpress": {
		source: "iana",
		extensions: [
			"qxd",
			"qxt",
			"qwd",
			"qwt",
			"qxl",
			"qxb"
		]
	},
		"application/vnd.quobject-quoxdocument": {
		source: "iana"
	},
		"application/vnd.radisys.moml+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-audit+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-audit-conf+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-audit-conn+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-audit-dialog+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-audit-stream+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-conf+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog-base+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog-fax-detect+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog-group+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog-speech+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.radisys.msml-dialog-transform+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.rainstor.data": {
		source: "iana"
	},
		"application/vnd.rapid": {
		source: "iana"
	},
		"application/vnd.rar": {
		source: "iana"
	},
		"application/vnd.realvnc.bed": {
		source: "iana",
		extensions: [
			"bed"
		]
	},
		"application/vnd.recordare.musicxml": {
		source: "iana",
		extensions: [
			"mxl"
		]
	},
		"application/vnd.recordare.musicxml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"musicxml"
		]
	},
		"application/vnd.renlearn.rlprint": {
		source: "iana"
	},
		"application/vnd.restful+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.rig.cryptonote": {
		source: "iana",
		extensions: [
			"cryptonote"
		]
	},
		"application/vnd.rim.cod": {
		source: "apache",
		extensions: [
			"cod"
		]
	},
		"application/vnd.rn-realmedia": {
		source: "apache",
		extensions: [
			"rm"
		]
	},
		"application/vnd.rn-realmedia-vbr": {
		source: "apache",
		extensions: [
			"rmvb"
		]
	},
		"application/vnd.route66.link66+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"link66"
		]
	},
		"application/vnd.rs-274x": {
		source: "iana"
	},
		"application/vnd.ruckus.download": {
		source: "iana"
	},
		"application/vnd.s3sms": {
		source: "iana"
	},
		"application/vnd.sailingtracker.track": {
		source: "iana",
		extensions: [
			"st"
		]
	},
		"application/vnd.sbm.cid": {
		source: "iana"
	},
		"application/vnd.sbm.mid2": {
		source: "iana"
	},
		"application/vnd.scribus": {
		source: "iana"
	},
		"application/vnd.sealed.3df": {
		source: "iana"
	},
		"application/vnd.sealed.csf": {
		source: "iana"
	},
		"application/vnd.sealed.doc": {
		source: "iana"
	},
		"application/vnd.sealed.eml": {
		source: "iana"
	},
		"application/vnd.sealed.mht": {
		source: "iana"
	},
		"application/vnd.sealed.net": {
		source: "iana"
	},
		"application/vnd.sealed.ppt": {
		source: "iana"
	},
		"application/vnd.sealed.tiff": {
		source: "iana"
	},
		"application/vnd.sealed.xls": {
		source: "iana"
	},
		"application/vnd.sealedmedia.softseal.html": {
		source: "iana"
	},
		"application/vnd.sealedmedia.softseal.pdf": {
		source: "iana"
	},
		"application/vnd.seemail": {
		source: "iana",
		extensions: [
			"see"
		]
	},
		"application/vnd.sema": {
		source: "iana",
		extensions: [
			"sema"
		]
	},
		"application/vnd.semd": {
		source: "iana",
		extensions: [
			"semd"
		]
	},
		"application/vnd.semf": {
		source: "iana",
		extensions: [
			"semf"
		]
	},
		"application/vnd.shana.informed.formdata": {
		source: "iana",
		extensions: [
			"ifm"
		]
	},
		"application/vnd.shana.informed.formtemplate": {
		source: "iana",
		extensions: [
			"itp"
		]
	},
		"application/vnd.shana.informed.interchange": {
		source: "iana",
		extensions: [
			"iif"
		]
	},
		"application/vnd.shana.informed.package": {
		source: "iana",
		extensions: [
			"ipk"
		]
	},
		"application/vnd.shootproof+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.sigrok.session": {
		source: "iana"
	},
		"application/vnd.simtech-mindmapper": {
		source: "iana",
		extensions: [
			"twd",
			"twds"
		]
	},
		"application/vnd.siren+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.smaf": {
		source: "iana",
		extensions: [
			"mmf"
		]
	},
		"application/vnd.smart.notebook": {
		source: "iana"
	},
		"application/vnd.smart.teacher": {
		source: "iana",
		extensions: [
			"teacher"
		]
	},
		"application/vnd.software602.filler.form+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.software602.filler.form-xml-zip": {
		source: "iana"
	},
		"application/vnd.solent.sdkm+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"sdkm",
			"sdkd"
		]
	},
		"application/vnd.spotfire.dxp": {
		source: "iana",
		extensions: [
			"dxp"
		]
	},
		"application/vnd.spotfire.sfs": {
		source: "iana",
		extensions: [
			"sfs"
		]
	},
		"application/vnd.sqlite3": {
		source: "iana"
	},
		"application/vnd.sss-cod": {
		source: "iana"
	},
		"application/vnd.sss-dtf": {
		source: "iana"
	},
		"application/vnd.sss-ntf": {
		source: "iana"
	},
		"application/vnd.stardivision.calc": {
		source: "apache",
		extensions: [
			"sdc"
		]
	},
		"application/vnd.stardivision.draw": {
		source: "apache",
		extensions: [
			"sda"
		]
	},
		"application/vnd.stardivision.impress": {
		source: "apache",
		extensions: [
			"sdd"
		]
	},
		"application/vnd.stardivision.math": {
		source: "apache",
		extensions: [
			"smf"
		]
	},
		"application/vnd.stardivision.writer": {
		source: "apache",
		extensions: [
			"sdw",
			"vor"
		]
	},
		"application/vnd.stardivision.writer-global": {
		source: "apache",
		extensions: [
			"sgl"
		]
	},
		"application/vnd.stepmania.package": {
		source: "iana",
		extensions: [
			"smzip"
		]
	},
		"application/vnd.stepmania.stepchart": {
		source: "iana",
		extensions: [
			"sm"
		]
	},
		"application/vnd.street-stream": {
		source: "iana"
	},
		"application/vnd.sun.wadl+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"wadl"
		]
	},
		"application/vnd.sun.xml.calc": {
		source: "apache",
		extensions: [
			"sxc"
		]
	},
		"application/vnd.sun.xml.calc.template": {
		source: "apache",
		extensions: [
			"stc"
		]
	},
		"application/vnd.sun.xml.draw": {
		source: "apache",
		extensions: [
			"sxd"
		]
	},
		"application/vnd.sun.xml.draw.template": {
		source: "apache",
		extensions: [
			"std"
		]
	},
		"application/vnd.sun.xml.impress": {
		source: "apache",
		extensions: [
			"sxi"
		]
	},
		"application/vnd.sun.xml.impress.template": {
		source: "apache",
		extensions: [
			"sti"
		]
	},
		"application/vnd.sun.xml.math": {
		source: "apache",
		extensions: [
			"sxm"
		]
	},
		"application/vnd.sun.xml.writer": {
		source: "apache",
		extensions: [
			"sxw"
		]
	},
		"application/vnd.sun.xml.writer.global": {
		source: "apache",
		extensions: [
			"sxg"
		]
	},
		"application/vnd.sun.xml.writer.template": {
		source: "apache",
		extensions: [
			"stw"
		]
	},
		"application/vnd.sus-calendar": {
		source: "iana",
		extensions: [
			"sus",
			"susp"
		]
	},
		"application/vnd.svd": {
		source: "iana",
		extensions: [
			"svd"
		]
	},
		"application/vnd.swiftview-ics": {
		source: "iana"
	},
		"application/vnd.symbian.install": {
		source: "apache",
		extensions: [
			"sis",
			"sisx"
		]
	},
		"application/vnd.syncml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xsm"
		]
	},
		"application/vnd.syncml.dm+wbxml": {
		source: "iana",
		extensions: [
			"bdm"
		]
	},
		"application/vnd.syncml.dm+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xdm"
		]
	},
		"application/vnd.syncml.dm.notification": {
		source: "iana"
	},
		"application/vnd.syncml.dmddf+wbxml": {
		source: "iana"
	},
		"application/vnd.syncml.dmddf+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.syncml.dmtnds+wbxml": {
		source: "iana"
	},
		"application/vnd.syncml.dmtnds+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.syncml.ds.notification": {
		source: "iana"
	},
		"application/vnd.tableschema+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.tao.intent-module-archive": {
		source: "iana",
		extensions: [
			"tao"
		]
	},
		"application/vnd.tcpdump.pcap": {
		source: "iana",
		extensions: [
			"pcap",
			"cap",
			"dmp"
		]
	},
		"application/vnd.think-cell.ppttc+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.tmd.mediaflex.api+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.tml": {
		source: "iana"
	},
		"application/vnd.tmobile-livetv": {
		source: "iana",
		extensions: [
			"tmo"
		]
	},
		"application/vnd.tri.onesource": {
		source: "iana"
	},
		"application/vnd.trid.tpt": {
		source: "iana",
		extensions: [
			"tpt"
		]
	},
		"application/vnd.triscape.mxs": {
		source: "iana",
		extensions: [
			"mxs"
		]
	},
		"application/vnd.trueapp": {
		source: "iana",
		extensions: [
			"tra"
		]
	},
		"application/vnd.truedoc": {
		source: "iana"
	},
		"application/vnd.ubisoft.webplayer": {
		source: "iana"
	},
		"application/vnd.ufdl": {
		source: "iana",
		extensions: [
			"ufd",
			"ufdl"
		]
	},
		"application/vnd.uiq.theme": {
		source: "iana",
		extensions: [
			"utz"
		]
	},
		"application/vnd.umajin": {
		source: "iana",
		extensions: [
			"umj"
		]
	},
		"application/vnd.unity": {
		source: "iana",
		extensions: [
			"unityweb"
		]
	},
		"application/vnd.uoml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"uoml"
		]
	},
		"application/vnd.uplanet.alert": {
		source: "iana"
	},
		"application/vnd.uplanet.alert-wbxml": {
		source: "iana"
	},
		"application/vnd.uplanet.bearer-choice": {
		source: "iana"
	},
		"application/vnd.uplanet.bearer-choice-wbxml": {
		source: "iana"
	},
		"application/vnd.uplanet.cacheop": {
		source: "iana"
	},
		"application/vnd.uplanet.cacheop-wbxml": {
		source: "iana"
	},
		"application/vnd.uplanet.channel": {
		source: "iana"
	},
		"application/vnd.uplanet.channel-wbxml": {
		source: "iana"
	},
		"application/vnd.uplanet.list": {
		source: "iana"
	},
		"application/vnd.uplanet.list-wbxml": {
		source: "iana"
	},
		"application/vnd.uplanet.listcmd": {
		source: "iana"
	},
		"application/vnd.uplanet.listcmd-wbxml": {
		source: "iana"
	},
		"application/vnd.uplanet.signal": {
		source: "iana"
	},
		"application/vnd.uri-map": {
		source: "iana"
	},
		"application/vnd.valve.source.material": {
		source: "iana"
	},
		"application/vnd.vcx": {
		source: "iana",
		extensions: [
			"vcx"
		]
	},
		"application/vnd.vd-study": {
		source: "iana"
	},
		"application/vnd.vectorworks": {
		source: "iana"
	},
		"application/vnd.vel+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.verimatrix.vcas": {
		source: "iana"
	},
		"application/vnd.vidsoft.vidconference": {
		source: "iana"
	},
		"application/vnd.visio": {
		source: "iana",
		extensions: [
			"vsd",
			"vst",
			"vss",
			"vsw"
		]
	},
		"application/vnd.visionary": {
		source: "iana",
		extensions: [
			"vis"
		]
	},
		"application/vnd.vividence.scriptfile": {
		source: "iana"
	},
		"application/vnd.vsf": {
		source: "iana",
		extensions: [
			"vsf"
		]
	},
		"application/vnd.wap.sic": {
		source: "iana"
	},
		"application/vnd.wap.slc": {
		source: "iana"
	},
		"application/vnd.wap.wbxml": {
		source: "iana",
		extensions: [
			"wbxml"
		]
	},
		"application/vnd.wap.wmlc": {
		source: "iana",
		extensions: [
			"wmlc"
		]
	},
		"application/vnd.wap.wmlscriptc": {
		source: "iana",
		extensions: [
			"wmlsc"
		]
	},
		"application/vnd.webturbo": {
		source: "iana",
		extensions: [
			"wtb"
		]
	},
		"application/vnd.wfa.p2p": {
		source: "iana"
	},
		"application/vnd.wfa.wsc": {
		source: "iana"
	},
		"application/vnd.windows.devicepairing": {
		source: "iana"
	},
		"application/vnd.wmc": {
		source: "iana"
	},
		"application/vnd.wmf.bootstrap": {
		source: "iana"
	},
		"application/vnd.wolfram.mathematica": {
		source: "iana"
	},
		"application/vnd.wolfram.mathematica.package": {
		source: "iana"
	},
		"application/vnd.wolfram.player": {
		source: "iana",
		extensions: [
			"nbp"
		]
	},
		"application/vnd.wordperfect": {
		source: "iana",
		extensions: [
			"wpd"
		]
	},
		"application/vnd.wqd": {
		source: "iana",
		extensions: [
			"wqd"
		]
	},
		"application/vnd.wrq-hp3000-labelled": {
		source: "iana"
	},
		"application/vnd.wt.stf": {
		source: "iana",
		extensions: [
			"stf"
		]
	},
		"application/vnd.wv.csp+wbxml": {
		source: "iana"
	},
		"application/vnd.wv.csp+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.wv.ssp+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.xacml+json": {
		source: "iana",
		compressible: true
	},
		"application/vnd.xara": {
		source: "iana",
		extensions: [
			"xar"
		]
	},
		"application/vnd.xfdl": {
		source: "iana",
		extensions: [
			"xfdl"
		]
	},
		"application/vnd.xfdl.webform": {
		source: "iana"
	},
		"application/vnd.xmi+xml": {
		source: "iana",
		compressible: true
	},
		"application/vnd.xmpie.cpkg": {
		source: "iana"
	},
		"application/vnd.xmpie.dpkg": {
		source: "iana"
	},
		"application/vnd.xmpie.plan": {
		source: "iana"
	},
		"application/vnd.xmpie.ppkg": {
		source: "iana"
	},
		"application/vnd.xmpie.xlim": {
		source: "iana"
	},
		"application/vnd.yamaha.hv-dic": {
		source: "iana",
		extensions: [
			"hvd"
		]
	},
		"application/vnd.yamaha.hv-script": {
		source: "iana",
		extensions: [
			"hvs"
		]
	},
		"application/vnd.yamaha.hv-voice": {
		source: "iana",
		extensions: [
			"hvp"
		]
	},
		"application/vnd.yamaha.openscoreformat": {
		source: "iana",
		extensions: [
			"osf"
		]
	},
		"application/vnd.yamaha.openscoreformat.osfpvg+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"osfpvg"
		]
	},
		"application/vnd.yamaha.remote-setup": {
		source: "iana"
	},
		"application/vnd.yamaha.smaf-audio": {
		source: "iana",
		extensions: [
			"saf"
		]
	},
		"application/vnd.yamaha.smaf-phrase": {
		source: "iana",
		extensions: [
			"spf"
		]
	},
		"application/vnd.yamaha.through-ngn": {
		source: "iana"
	},
		"application/vnd.yamaha.tunnel-udpencap": {
		source: "iana"
	},
		"application/vnd.yaoweme": {
		source: "iana"
	},
		"application/vnd.yellowriver-custom-menu": {
		source: "iana",
		extensions: [
			"cmp"
		]
	},
		"application/vnd.youtube.yt": {
		source: "iana"
	},
		"application/vnd.zul": {
		source: "iana",
		extensions: [
			"zir",
			"zirz"
		]
	},
		"application/vnd.zzazz.deck+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"zaz"
		]
	},
		"application/voicexml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"vxml"
		]
	},
		"application/voucher-cms+json": {
		source: "iana",
		compressible: true
	},
		"application/vq-rtcpxr": {
		source: "iana"
	},
		"application/wasm": {
		compressible: true,
		extensions: [
			"wasm"
		]
	},
		"application/watcherinfo+xml": {
		source: "iana",
		compressible: true
	},
		"application/webpush-options+json": {
		source: "iana",
		compressible: true
	},
		"application/whoispp-query": {
		source: "iana"
	},
		"application/whoispp-response": {
		source: "iana"
	},
		"application/widget": {
		source: "iana",
		extensions: [
			"wgt"
		]
	},
		"application/winhlp": {
		source: "apache",
		extensions: [
			"hlp"
		]
	},
		"application/wita": {
		source: "iana"
	},
		"application/wordperfect5.1": {
		source: "iana"
	},
		"application/wsdl+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"wsdl"
		]
	},
		"application/wspolicy+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"wspolicy"
		]
	},
		"application/x-7z-compressed": {
		source: "apache",
		compressible: false,
		extensions: [
			"7z"
		]
	},
		"application/x-abiword": {
		source: "apache",
		extensions: [
			"abw"
		]
	},
		"application/x-ace-compressed": {
		source: "apache",
		extensions: [
			"ace"
		]
	},
		"application/x-amf": {
		source: "apache"
	},
		"application/x-apple-diskimage": {
		source: "apache",
		extensions: [
			"dmg"
		]
	},
		"application/x-arj": {
		compressible: false,
		extensions: [
			"arj"
		]
	},
		"application/x-authorware-bin": {
		source: "apache",
		extensions: [
			"aab",
			"x32",
			"u32",
			"vox"
		]
	},
		"application/x-authorware-map": {
		source: "apache",
		extensions: [
			"aam"
		]
	},
		"application/x-authorware-seg": {
		source: "apache",
		extensions: [
			"aas"
		]
	},
		"application/x-bcpio": {
		source: "apache",
		extensions: [
			"bcpio"
		]
	},
		"application/x-bdoc": {
		compressible: false,
		extensions: [
			"bdoc"
		]
	},
		"application/x-bittorrent": {
		source: "apache",
		extensions: [
			"torrent"
		]
	},
		"application/x-blorb": {
		source: "apache",
		extensions: [
			"blb",
			"blorb"
		]
	},
		"application/x-bzip": {
		source: "apache",
		compressible: false,
		extensions: [
			"bz"
		]
	},
		"application/x-bzip2": {
		source: "apache",
		compressible: false,
		extensions: [
			"bz2",
			"boz"
		]
	},
		"application/x-cbr": {
		source: "apache",
		extensions: [
			"cbr",
			"cba",
			"cbt",
			"cbz",
			"cb7"
		]
	},
		"application/x-cdlink": {
		source: "apache",
		extensions: [
			"vcd"
		]
	},
		"application/x-cfs-compressed": {
		source: "apache",
		extensions: [
			"cfs"
		]
	},
		"application/x-chat": {
		source: "apache",
		extensions: [
			"chat"
		]
	},
		"application/x-chess-pgn": {
		source: "apache",
		extensions: [
			"pgn"
		]
	},
		"application/x-chrome-extension": {
		extensions: [
			"crx"
		]
	},
		"application/x-cocoa": {
		source: "nginx",
		extensions: [
			"cco"
		]
	},
		"application/x-compress": {
		source: "apache"
	},
		"application/x-conference": {
		source: "apache",
		extensions: [
			"nsc"
		]
	},
		"application/x-cpio": {
		source: "apache",
		extensions: [
			"cpio"
		]
	},
		"application/x-csh": {
		source: "apache",
		extensions: [
			"csh"
		]
	},
		"application/x-deb": {
		compressible: false
	},
		"application/x-debian-package": {
		source: "apache",
		extensions: [
			"deb",
			"udeb"
		]
	},
		"application/x-dgc-compressed": {
		source: "apache",
		extensions: [
			"dgc"
		]
	},
		"application/x-director": {
		source: "apache",
		extensions: [
			"dir",
			"dcr",
			"dxr",
			"cst",
			"cct",
			"cxt",
			"w3d",
			"fgd",
			"swa"
		]
	},
		"application/x-doom": {
		source: "apache",
		extensions: [
			"wad"
		]
	},
		"application/x-dtbncx+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"ncx"
		]
	},
		"application/x-dtbook+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"dtb"
		]
	},
		"application/x-dtbresource+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"res"
		]
	},
		"application/x-dvi": {
		source: "apache",
		compressible: false,
		extensions: [
			"dvi"
		]
	},
		"application/x-envoy": {
		source: "apache",
		extensions: [
			"evy"
		]
	},
		"application/x-eva": {
		source: "apache",
		extensions: [
			"eva"
		]
	},
		"application/x-font-bdf": {
		source: "apache",
		extensions: [
			"bdf"
		]
	},
		"application/x-font-dos": {
		source: "apache"
	},
		"application/x-font-framemaker": {
		source: "apache"
	},
		"application/x-font-ghostscript": {
		source: "apache",
		extensions: [
			"gsf"
		]
	},
		"application/x-font-libgrx": {
		source: "apache"
	},
		"application/x-font-linux-psf": {
		source: "apache",
		extensions: [
			"psf"
		]
	},
		"application/x-font-pcf": {
		source: "apache",
		extensions: [
			"pcf"
		]
	},
		"application/x-font-snf": {
		source: "apache",
		extensions: [
			"snf"
		]
	},
		"application/x-font-speedo": {
		source: "apache"
	},
		"application/x-font-sunos-news": {
		source: "apache"
	},
		"application/x-font-type1": {
		source: "apache",
		extensions: [
			"pfa",
			"pfb",
			"pfm",
			"afm"
		]
	},
		"application/x-font-vfont": {
		source: "apache"
	},
		"application/x-freearc": {
		source: "apache",
		extensions: [
			"arc"
		]
	},
		"application/x-futuresplash": {
		source: "apache",
		extensions: [
			"spl"
		]
	},
		"application/x-gca-compressed": {
		source: "apache",
		extensions: [
			"gca"
		]
	},
		"application/x-glulx": {
		source: "apache",
		extensions: [
			"ulx"
		]
	},
		"application/x-gnumeric": {
		source: "apache",
		extensions: [
			"gnumeric"
		]
	},
		"application/x-gramps-xml": {
		source: "apache",
		extensions: [
			"gramps"
		]
	},
		"application/x-gtar": {
		source: "apache",
		extensions: [
			"gtar"
		]
	},
		"application/x-gzip": {
		source: "apache"
	},
		"application/x-hdf": {
		source: "apache",
		extensions: [
			"hdf"
		]
	},
		"application/x-httpd-php": {
		compressible: true,
		extensions: [
			"php"
		]
	},
		"application/x-install-instructions": {
		source: "apache",
		extensions: [
			"install"
		]
	},
		"application/x-iso9660-image": {
		source: "apache",
		extensions: [
			"iso"
		]
	},
		"application/x-java-archive-diff": {
		source: "nginx",
		extensions: [
			"jardiff"
		]
	},
		"application/x-java-jnlp-file": {
		source: "apache",
		compressible: false,
		extensions: [
			"jnlp"
		]
	},
		"application/x-javascript": {
		compressible: true
	},
		"application/x-latex": {
		source: "apache",
		compressible: false,
		extensions: [
			"latex"
		]
	},
		"application/x-lua-bytecode": {
		extensions: [
			"luac"
		]
	},
		"application/x-lzh-compressed": {
		source: "apache",
		extensions: [
			"lzh",
			"lha"
		]
	},
		"application/x-makeself": {
		source: "nginx",
		extensions: [
			"run"
		]
	},
		"application/x-mie": {
		source: "apache",
		extensions: [
			"mie"
		]
	},
		"application/x-mobipocket-ebook": {
		source: "apache",
		extensions: [
			"prc",
			"mobi"
		]
	},
		"application/x-mpegurl": {
		compressible: false
	},
		"application/x-ms-application": {
		source: "apache",
		extensions: [
			"application"
		]
	},
		"application/x-ms-shortcut": {
		source: "apache",
		extensions: [
			"lnk"
		]
	},
		"application/x-ms-wmd": {
		source: "apache",
		extensions: [
			"wmd"
		]
	},
		"application/x-ms-wmz": {
		source: "apache",
		extensions: [
			"wmz"
		]
	},
		"application/x-ms-xbap": {
		source: "apache",
		extensions: [
			"xbap"
		]
	},
		"application/x-msaccess": {
		source: "apache",
		extensions: [
			"mdb"
		]
	},
		"application/x-msbinder": {
		source: "apache",
		extensions: [
			"obd"
		]
	},
		"application/x-mscardfile": {
		source: "apache",
		extensions: [
			"crd"
		]
	},
		"application/x-msclip": {
		source: "apache",
		extensions: [
			"clp"
		]
	},
		"application/x-msdos-program": {
		extensions: [
			"exe"
		]
	},
		"application/x-msdownload": {
		source: "apache",
		extensions: [
			"exe",
			"dll",
			"com",
			"bat",
			"msi"
		]
	},
		"application/x-msmediaview": {
		source: "apache",
		extensions: [
			"mvb",
			"m13",
			"m14"
		]
	},
		"application/x-msmetafile": {
		source: "apache",
		extensions: [
			"wmf",
			"wmz",
			"emf",
			"emz"
		]
	},
		"application/x-msmoney": {
		source: "apache",
		extensions: [
			"mny"
		]
	},
		"application/x-mspublisher": {
		source: "apache",
		extensions: [
			"pub"
		]
	},
		"application/x-msschedule": {
		source: "apache",
		extensions: [
			"scd"
		]
	},
		"application/x-msterminal": {
		source: "apache",
		extensions: [
			"trm"
		]
	},
		"application/x-mswrite": {
		source: "apache",
		extensions: [
			"wri"
		]
	},
		"application/x-netcdf": {
		source: "apache",
		extensions: [
			"nc",
			"cdf"
		]
	},
		"application/x-ns-proxy-autoconfig": {
		compressible: true,
		extensions: [
			"pac"
		]
	},
		"application/x-nzb": {
		source: "apache",
		extensions: [
			"nzb"
		]
	},
		"application/x-perl": {
		source: "nginx",
		extensions: [
			"pl",
			"pm"
		]
	},
		"application/x-pilot": {
		source: "nginx",
		extensions: [
			"prc",
			"pdb"
		]
	},
		"application/x-pkcs12": {
		source: "apache",
		compressible: false,
		extensions: [
			"p12",
			"pfx"
		]
	},
		"application/x-pkcs7-certificates": {
		source: "apache",
		extensions: [
			"p7b",
			"spc"
		]
	},
		"application/x-pkcs7-certreqresp": {
		source: "apache",
		extensions: [
			"p7r"
		]
	},
		"application/x-rar-compressed": {
		source: "apache",
		compressible: false,
		extensions: [
			"rar"
		]
	},
		"application/x-redhat-package-manager": {
		source: "nginx",
		extensions: [
			"rpm"
		]
	},
		"application/x-research-info-systems": {
		source: "apache",
		extensions: [
			"ris"
		]
	},
		"application/x-sea": {
		source: "nginx",
		extensions: [
			"sea"
		]
	},
		"application/x-sh": {
		source: "apache",
		compressible: true,
		extensions: [
			"sh"
		]
	},
		"application/x-shar": {
		source: "apache",
		extensions: [
			"shar"
		]
	},
		"application/x-shockwave-flash": {
		source: "apache",
		compressible: false,
		extensions: [
			"swf"
		]
	},
		"application/x-silverlight-app": {
		source: "apache",
		extensions: [
			"xap"
		]
	},
		"application/x-sql": {
		source: "apache",
		extensions: [
			"sql"
		]
	},
		"application/x-stuffit": {
		source: "apache",
		compressible: false,
		extensions: [
			"sit"
		]
	},
		"application/x-stuffitx": {
		source: "apache",
		extensions: [
			"sitx"
		]
	},
		"application/x-subrip": {
		source: "apache",
		extensions: [
			"srt"
		]
	},
		"application/x-sv4cpio": {
		source: "apache",
		extensions: [
			"sv4cpio"
		]
	},
		"application/x-sv4crc": {
		source: "apache",
		extensions: [
			"sv4crc"
		]
	},
		"application/x-t3vm-image": {
		source: "apache",
		extensions: [
			"t3"
		]
	},
		"application/x-tads": {
		source: "apache",
		extensions: [
			"gam"
		]
	},
		"application/x-tar": {
		source: "apache",
		compressible: true,
		extensions: [
			"tar"
		]
	},
		"application/x-tcl": {
		source: "apache",
		extensions: [
			"tcl",
			"tk"
		]
	},
		"application/x-tex": {
		source: "apache",
		extensions: [
			"tex"
		]
	},
		"application/x-tex-tfm": {
		source: "apache",
		extensions: [
			"tfm"
		]
	},
		"application/x-texinfo": {
		source: "apache",
		extensions: [
			"texinfo",
			"texi"
		]
	},
		"application/x-tgif": {
		source: "apache",
		extensions: [
			"obj"
		]
	},
		"application/x-ustar": {
		source: "apache",
		extensions: [
			"ustar"
		]
	},
		"application/x-virtualbox-hdd": {
		compressible: true,
		extensions: [
			"hdd"
		]
	},
		"application/x-virtualbox-ova": {
		compressible: true,
		extensions: [
			"ova"
		]
	},
		"application/x-virtualbox-ovf": {
		compressible: true,
		extensions: [
			"ovf"
		]
	},
		"application/x-virtualbox-vbox": {
		compressible: true,
		extensions: [
			"vbox"
		]
	},
		"application/x-virtualbox-vbox-extpack": {
		compressible: false,
		extensions: [
			"vbox-extpack"
		]
	},
		"application/x-virtualbox-vdi": {
		compressible: true,
		extensions: [
			"vdi"
		]
	},
		"application/x-virtualbox-vhd": {
		compressible: true,
		extensions: [
			"vhd"
		]
	},
		"application/x-virtualbox-vmdk": {
		compressible: true,
		extensions: [
			"vmdk"
		]
	},
		"application/x-wais-source": {
		source: "apache",
		extensions: [
			"src"
		]
	},
		"application/x-web-app-manifest+json": {
		compressible: true,
		extensions: [
			"webapp"
		]
	},
		"application/x-www-form-urlencoded": {
		source: "iana",
		compressible: true
	},
		"application/x-x509-ca-cert": {
		source: "apache",
		extensions: [
			"der",
			"crt",
			"pem"
		]
	},
		"application/x-xfig": {
		source: "apache",
		extensions: [
			"fig"
		]
	},
		"application/x-xliff+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"xlf"
		]
	},
		"application/x-xpinstall": {
		source: "apache",
		compressible: false,
		extensions: [
			"xpi"
		]
	},
		"application/x-xz": {
		source: "apache",
		extensions: [
			"xz"
		]
	},
		"application/x-zmachine": {
		source: "apache",
		extensions: [
			"z1",
			"z2",
			"z3",
			"z4",
			"z5",
			"z6",
			"z7",
			"z8"
		]
	},
		"application/x400-bp": {
		source: "iana"
	},
		"application/xacml+xml": {
		source: "iana",
		compressible: true
	},
		"application/xaml+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"xaml"
		]
	},
		"application/xcap-att+xml": {
		source: "iana",
		compressible: true
	},
		"application/xcap-caps+xml": {
		source: "iana",
		compressible: true
	},
		"application/xcap-diff+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xdf"
		]
	},
		"application/xcap-el+xml": {
		source: "iana",
		compressible: true
	},
		"application/xcap-error+xml": {
		source: "iana",
		compressible: true
	},
		"application/xcap-ns+xml": {
		source: "iana",
		compressible: true
	},
		"application/xcon-conference-info+xml": {
		source: "iana",
		compressible: true
	},
		"application/xcon-conference-info-diff+xml": {
		source: "iana",
		compressible: true
	},
		"application/xenc+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xenc"
		]
	},
		"application/xhtml+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xhtml",
			"xht"
		]
	},
		"application/xhtml-voice+xml": {
		source: "apache",
		compressible: true
	},
		"application/xliff+xml": {
		source: "iana",
		compressible: true
	},
		"application/xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xml",
			"xsl",
			"xsd",
			"rng"
		]
	},
		"application/xml-dtd": {
		source: "iana",
		compressible: true,
		extensions: [
			"dtd"
		]
	},
		"application/xml-external-parsed-entity": {
		source: "iana"
	},
		"application/xml-patch+xml": {
		source: "iana",
		compressible: true
	},
		"application/xmpp+xml": {
		source: "iana",
		compressible: true
	},
		"application/xop+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xop"
		]
	},
		"application/xproc+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"xpl"
		]
	},
		"application/xslt+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xslt"
		]
	},
		"application/xspf+xml": {
		source: "apache",
		compressible: true,
		extensions: [
			"xspf"
		]
	},
		"application/xv+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"mxml",
			"xhvml",
			"xvml",
			"xvm"
		]
	},
		"application/yang": {
		source: "iana",
		extensions: [
			"yang"
		]
	},
		"application/yang-data+json": {
		source: "iana",
		compressible: true
	},
		"application/yang-data+xml": {
		source: "iana",
		compressible: true
	},
		"application/yang-patch+json": {
		source: "iana",
		compressible: true
	},
		"application/yang-patch+xml": {
		source: "iana",
		compressible: true
	},
		"application/yin+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"yin"
		]
	},
		"application/zip": {
		source: "iana",
		compressible: false,
		extensions: [
			"zip"
		]
	},
		"application/zlib": {
		source: "iana"
	},
		"audio/1d-interleaved-parityfec": {
		source: "iana"
	},
		"audio/32kadpcm": {
		source: "iana"
	},
		"audio/3gpp": {
		source: "iana",
		compressible: false,
		extensions: [
			"3gpp"
		]
	},
		"audio/3gpp2": {
		source: "iana"
	},
		"audio/aac": {
		source: "iana"
	},
		"audio/ac3": {
		source: "iana"
	},
		"audio/adpcm": {
		source: "apache",
		extensions: [
			"adp"
		]
	},
		"audio/amr": {
		source: "iana"
	},
		"audio/amr-wb": {
		source: "iana"
	},
		"audio/amr-wb+": {
		source: "iana"
	},
		"audio/aptx": {
		source: "iana"
	},
		"audio/asc": {
		source: "iana"
	},
		"audio/atrac-advanced-lossless": {
		source: "iana"
	},
		"audio/atrac-x": {
		source: "iana"
	},
		"audio/atrac3": {
		source: "iana"
	},
		"audio/basic": {
		source: "iana",
		compressible: false,
		extensions: [
			"au",
			"snd"
		]
	},
		"audio/bv16": {
		source: "iana"
	},
		"audio/bv32": {
		source: "iana"
	},
		"audio/clearmode": {
		source: "iana"
	},
		"audio/cn": {
		source: "iana"
	},
		"audio/dat12": {
		source: "iana"
	},
		"audio/dls": {
		source: "iana"
	},
		"audio/dsr-es201108": {
		source: "iana"
	},
		"audio/dsr-es202050": {
		source: "iana"
	},
		"audio/dsr-es202211": {
		source: "iana"
	},
		"audio/dsr-es202212": {
		source: "iana"
	},
		"audio/dv": {
		source: "iana"
	},
		"audio/dvi4": {
		source: "iana"
	},
		"audio/eac3": {
		source: "iana"
	},
		"audio/encaprtp": {
		source: "iana"
	},
		"audio/evrc": {
		source: "iana"
	},
		"audio/evrc-qcp": {
		source: "iana"
	},
		"audio/evrc0": {
		source: "iana"
	},
		"audio/evrc1": {
		source: "iana"
	},
		"audio/evrcb": {
		source: "iana"
	},
		"audio/evrcb0": {
		source: "iana"
	},
		"audio/evrcb1": {
		source: "iana"
	},
		"audio/evrcnw": {
		source: "iana"
	},
		"audio/evrcnw0": {
		source: "iana"
	},
		"audio/evrcnw1": {
		source: "iana"
	},
		"audio/evrcwb": {
		source: "iana"
	},
		"audio/evrcwb0": {
		source: "iana"
	},
		"audio/evrcwb1": {
		source: "iana"
	},
		"audio/evs": {
		source: "iana"
	},
		"audio/fwdred": {
		source: "iana"
	},
		"audio/g711-0": {
		source: "iana"
	},
		"audio/g719": {
		source: "iana"
	},
		"audio/g722": {
		source: "iana"
	},
		"audio/g7221": {
		source: "iana"
	},
		"audio/g723": {
		source: "iana"
	},
		"audio/g726-16": {
		source: "iana"
	},
		"audio/g726-24": {
		source: "iana"
	},
		"audio/g726-32": {
		source: "iana"
	},
		"audio/g726-40": {
		source: "iana"
	},
		"audio/g728": {
		source: "iana"
	},
		"audio/g729": {
		source: "iana"
	},
		"audio/g7291": {
		source: "iana"
	},
		"audio/g729d": {
		source: "iana"
	},
		"audio/g729e": {
		source: "iana"
	},
		"audio/gsm": {
		source: "iana"
	},
		"audio/gsm-efr": {
		source: "iana"
	},
		"audio/gsm-hr-08": {
		source: "iana"
	},
		"audio/ilbc": {
		source: "iana"
	},
		"audio/ip-mr_v2.5": {
		source: "iana"
	},
		"audio/isac": {
		source: "apache"
	},
		"audio/l16": {
		source: "iana"
	},
		"audio/l20": {
		source: "iana"
	},
		"audio/l24": {
		source: "iana",
		compressible: false
	},
		"audio/l8": {
		source: "iana"
	},
		"audio/lpc": {
		source: "iana"
	},
		"audio/melp": {
		source: "iana"
	},
		"audio/melp1200": {
		source: "iana"
	},
		"audio/melp2400": {
		source: "iana"
	},
		"audio/melp600": {
		source: "iana"
	},
		"audio/midi": {
		source: "apache",
		extensions: [
			"mid",
			"midi",
			"kar",
			"rmi"
		]
	},
		"audio/mobile-xmf": {
		source: "iana"
	},
		"audio/mp3": {
		compressible: false,
		extensions: [
			"mp3"
		]
	},
		"audio/mp4": {
		source: "iana",
		compressible: false,
		extensions: [
			"m4a",
			"mp4a"
		]
	},
		"audio/mp4a-latm": {
		source: "iana"
	},
		"audio/mpa": {
		source: "iana"
	},
		"audio/mpa-robust": {
		source: "iana"
	},
		"audio/mpeg": {
		source: "iana",
		compressible: false,
		extensions: [
			"mpga",
			"mp2",
			"mp2a",
			"mp3",
			"m2a",
			"m3a"
		]
	},
		"audio/mpeg4-generic": {
		source: "iana"
	},
		"audio/musepack": {
		source: "apache"
	},
		"audio/ogg": {
		source: "iana",
		compressible: false,
		extensions: [
			"oga",
			"ogg",
			"spx"
		]
	},
		"audio/opus": {
		source: "iana"
	},
		"audio/parityfec": {
		source: "iana"
	},
		"audio/pcma": {
		source: "iana"
	},
		"audio/pcma-wb": {
		source: "iana"
	},
		"audio/pcmu": {
		source: "iana"
	},
		"audio/pcmu-wb": {
		source: "iana"
	},
		"audio/prs.sid": {
		source: "iana"
	},
		"audio/qcelp": {
		source: "iana"
	},
		"audio/raptorfec": {
		source: "iana"
	},
		"audio/red": {
		source: "iana"
	},
		"audio/rtp-enc-aescm128": {
		source: "iana"
	},
		"audio/rtp-midi": {
		source: "iana"
	},
		"audio/rtploopback": {
		source: "iana"
	},
		"audio/rtx": {
		source: "iana"
	},
		"audio/s3m": {
		source: "apache",
		extensions: [
			"s3m"
		]
	},
		"audio/silk": {
		source: "apache",
		extensions: [
			"sil"
		]
	},
		"audio/smv": {
		source: "iana"
	},
		"audio/smv-qcp": {
		source: "iana"
	},
		"audio/smv0": {
		source: "iana"
	},
		"audio/sp-midi": {
		source: "iana"
	},
		"audio/speex": {
		source: "iana"
	},
		"audio/t140c": {
		source: "iana"
	},
		"audio/t38": {
		source: "iana"
	},
		"audio/telephone-event": {
		source: "iana"
	},
		"audio/tone": {
		source: "iana"
	},
		"audio/uemclip": {
		source: "iana"
	},
		"audio/ulpfec": {
		source: "iana"
	},
		"audio/usac": {
		source: "iana"
	},
		"audio/vdvi": {
		source: "iana"
	},
		"audio/vmr-wb": {
		source: "iana"
	},
		"audio/vnd.3gpp.iufp": {
		source: "iana"
	},
		"audio/vnd.4sb": {
		source: "iana"
	},
		"audio/vnd.audiokoz": {
		source: "iana"
	},
		"audio/vnd.celp": {
		source: "iana"
	},
		"audio/vnd.cisco.nse": {
		source: "iana"
	},
		"audio/vnd.cmles.radio-events": {
		source: "iana"
	},
		"audio/vnd.cns.anp1": {
		source: "iana"
	},
		"audio/vnd.cns.inf1": {
		source: "iana"
	},
		"audio/vnd.dece.audio": {
		source: "iana",
		extensions: [
			"uva",
			"uvva"
		]
	},
		"audio/vnd.digital-winds": {
		source: "iana",
		extensions: [
			"eol"
		]
	},
		"audio/vnd.dlna.adts": {
		source: "iana"
	},
		"audio/vnd.dolby.heaac.1": {
		source: "iana"
	},
		"audio/vnd.dolby.heaac.2": {
		source: "iana"
	},
		"audio/vnd.dolby.mlp": {
		source: "iana"
	},
		"audio/vnd.dolby.mps": {
		source: "iana"
	},
		"audio/vnd.dolby.pl2": {
		source: "iana"
	},
		"audio/vnd.dolby.pl2x": {
		source: "iana"
	},
		"audio/vnd.dolby.pl2z": {
		source: "iana"
	},
		"audio/vnd.dolby.pulse.1": {
		source: "iana"
	},
		"audio/vnd.dra": {
		source: "iana",
		extensions: [
			"dra"
		]
	},
		"audio/vnd.dts": {
		source: "iana",
		extensions: [
			"dts"
		]
	},
		"audio/vnd.dts.hd": {
		source: "iana",
		extensions: [
			"dtshd"
		]
	},
		"audio/vnd.dvb.file": {
		source: "iana"
	},
		"audio/vnd.everad.plj": {
		source: "iana"
	},
		"audio/vnd.hns.audio": {
		source: "iana"
	},
		"audio/vnd.lucent.voice": {
		source: "iana",
		extensions: [
			"lvp"
		]
	},
		"audio/vnd.ms-playready.media.pya": {
		source: "iana",
		extensions: [
			"pya"
		]
	},
		"audio/vnd.nokia.mobile-xmf": {
		source: "iana"
	},
		"audio/vnd.nortel.vbk": {
		source: "iana"
	},
		"audio/vnd.nuera.ecelp4800": {
		source: "iana",
		extensions: [
			"ecelp4800"
		]
	},
		"audio/vnd.nuera.ecelp7470": {
		source: "iana",
		extensions: [
			"ecelp7470"
		]
	},
		"audio/vnd.nuera.ecelp9600": {
		source: "iana",
		extensions: [
			"ecelp9600"
		]
	},
		"audio/vnd.octel.sbc": {
		source: "iana"
	},
		"audio/vnd.presonus.multitrack": {
		source: "iana"
	},
		"audio/vnd.qcelp": {
		source: "iana"
	},
		"audio/vnd.rhetorex.32kadpcm": {
		source: "iana"
	},
		"audio/vnd.rip": {
		source: "iana",
		extensions: [
			"rip"
		]
	},
		"audio/vnd.rn-realaudio": {
		compressible: false
	},
		"audio/vnd.sealedmedia.softseal.mpeg": {
		source: "iana"
	},
		"audio/vnd.vmx.cvsd": {
		source: "iana"
	},
		"audio/vnd.wave": {
		compressible: false
	},
		"audio/vorbis": {
		source: "iana",
		compressible: false
	},
		"audio/vorbis-config": {
		source: "iana"
	},
		"audio/wav": {
		compressible: false,
		extensions: [
			"wav"
		]
	},
		"audio/wave": {
		compressible: false,
		extensions: [
			"wav"
		]
	},
		"audio/webm": {
		source: "apache",
		compressible: false,
		extensions: [
			"weba"
		]
	},
		"audio/x-aac": {
		source: "apache",
		compressible: false,
		extensions: [
			"aac"
		]
	},
		"audio/x-aiff": {
		source: "apache",
		extensions: [
			"aif",
			"aiff",
			"aifc"
		]
	},
		"audio/x-caf": {
		source: "apache",
		compressible: false,
		extensions: [
			"caf"
		]
	},
		"audio/x-flac": {
		source: "apache",
		extensions: [
			"flac"
		]
	},
		"audio/x-m4a": {
		source: "nginx",
		extensions: [
			"m4a"
		]
	},
		"audio/x-matroska": {
		source: "apache",
		extensions: [
			"mka"
		]
	},
		"audio/x-mpegurl": {
		source: "apache",
		extensions: [
			"m3u"
		]
	},
		"audio/x-ms-wax": {
		source: "apache",
		extensions: [
			"wax"
		]
	},
		"audio/x-ms-wma": {
		source: "apache",
		extensions: [
			"wma"
		]
	},
		"audio/x-pn-realaudio": {
		source: "apache",
		extensions: [
			"ram",
			"ra"
		]
	},
		"audio/x-pn-realaudio-plugin": {
		source: "apache",
		extensions: [
			"rmp"
		]
	},
		"audio/x-realaudio": {
		source: "nginx",
		extensions: [
			"ra"
		]
	},
		"audio/x-tta": {
		source: "apache"
	},
		"audio/x-wav": {
		source: "apache",
		extensions: [
			"wav"
		]
	},
		"audio/xm": {
		source: "apache",
		extensions: [
			"xm"
		]
	},
		"chemical/x-cdx": {
		source: "apache",
		extensions: [
			"cdx"
		]
	},
		"chemical/x-cif": {
		source: "apache",
		extensions: [
			"cif"
		]
	},
		"chemical/x-cmdf": {
		source: "apache",
		extensions: [
			"cmdf"
		]
	},
		"chemical/x-cml": {
		source: "apache",
		extensions: [
			"cml"
		]
	},
		"chemical/x-csml": {
		source: "apache",
		extensions: [
			"csml"
		]
	},
		"chemical/x-pdb": {
		source: "apache"
	},
		"chemical/x-xyz": {
		source: "apache",
		extensions: [
			"xyz"
		]
	},
		"font/collection": {
		source: "iana",
		extensions: [
			"ttc"
		]
	},
		"font/otf": {
		source: "iana",
		compressible: true,
		extensions: [
			"otf"
		]
	},
		"font/sfnt": {
		source: "iana"
	},
		"font/ttf": {
		source: "iana",
		extensions: [
			"ttf"
		]
	},
		"font/woff": {
		source: "iana",
		extensions: [
			"woff"
		]
	},
		"font/woff2": {
		source: "iana",
		extensions: [
			"woff2"
		]
	},
		"image/aces": {
		source: "iana"
	},
		"image/apng": {
		compressible: false,
		extensions: [
			"apng"
		]
	},
		"image/bmp": {
		source: "iana",
		compressible: true,
		extensions: [
			"bmp"
		]
	},
		"image/cgm": {
		source: "iana",
		extensions: [
			"cgm"
		]
	},
		"image/dicom-rle": {
		source: "iana"
	},
		"image/emf": {
		source: "iana"
	},
		"image/fits": {
		source: "iana"
	},
		"image/g3fax": {
		source: "iana",
		extensions: [
			"g3"
		]
	},
		"image/gif": {
		source: "iana",
		compressible: false,
		extensions: [
			"gif"
		]
	},
		"image/ief": {
		source: "iana",
		extensions: [
			"ief"
		]
	},
		"image/jls": {
		source: "iana"
	},
		"image/jp2": {
		source: "iana",
		compressible: false,
		extensions: [
			"jp2",
			"jpg2"
		]
	},
		"image/jpeg": {
		source: "iana",
		compressible: false,
		extensions: [
			"jpeg",
			"jpg",
			"jpe"
		]
	},
		"image/jpm": {
		source: "iana",
		compressible: false,
		extensions: [
			"jpm"
		]
	},
		"image/jpx": {
		source: "iana",
		compressible: false,
		extensions: [
			"jpx",
			"jpf"
		]
	},
		"image/ktx": {
		source: "iana",
		extensions: [
			"ktx"
		]
	},
		"image/naplps": {
		source: "iana"
	},
		"image/pjpeg": {
		compressible: false
	},
		"image/png": {
		source: "iana",
		compressible: false,
		extensions: [
			"png"
		]
	},
		"image/prs.btif": {
		source: "iana",
		extensions: [
			"btif"
		]
	},
		"image/prs.pti": {
		source: "iana"
	},
		"image/pwg-raster": {
		source: "iana"
	},
		"image/sgi": {
		source: "apache",
		extensions: [
			"sgi"
		]
	},
		"image/svg+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"svg",
			"svgz"
		]
	},
		"image/t38": {
		source: "iana"
	},
		"image/tiff": {
		source: "iana",
		compressible: false,
		extensions: [
			"tiff",
			"tif"
		]
	},
		"image/tiff-fx": {
		source: "iana"
	},
		"image/vnd.adobe.photoshop": {
		source: "iana",
		compressible: true,
		extensions: [
			"psd"
		]
	},
		"image/vnd.airzip.accelerator.azv": {
		source: "iana"
	},
		"image/vnd.cns.inf2": {
		source: "iana"
	},
		"image/vnd.dece.graphic": {
		source: "iana",
		extensions: [
			"uvi",
			"uvvi",
			"uvg",
			"uvvg"
		]
	},
		"image/vnd.djvu": {
		source: "iana",
		extensions: [
			"djvu",
			"djv"
		]
	},
		"image/vnd.dvb.subtitle": {
		source: "iana",
		extensions: [
			"sub"
		]
	},
		"image/vnd.dwg": {
		source: "iana",
		extensions: [
			"dwg"
		]
	},
		"image/vnd.dxf": {
		source: "iana",
		extensions: [
			"dxf"
		]
	},
		"image/vnd.fastbidsheet": {
		source: "iana",
		extensions: [
			"fbs"
		]
	},
		"image/vnd.fpx": {
		source: "iana",
		extensions: [
			"fpx"
		]
	},
		"image/vnd.fst": {
		source: "iana",
		extensions: [
			"fst"
		]
	},
		"image/vnd.fujixerox.edmics-mmr": {
		source: "iana",
		extensions: [
			"mmr"
		]
	},
		"image/vnd.fujixerox.edmics-rlc": {
		source: "iana",
		extensions: [
			"rlc"
		]
	},
		"image/vnd.globalgraphics.pgb": {
		source: "iana"
	},
		"image/vnd.microsoft.icon": {
		source: "iana"
	},
		"image/vnd.mix": {
		source: "iana"
	},
		"image/vnd.mozilla.apng": {
		source: "iana"
	},
		"image/vnd.ms-modi": {
		source: "iana",
		extensions: [
			"mdi"
		]
	},
		"image/vnd.ms-photo": {
		source: "apache",
		extensions: [
			"wdp"
		]
	},
		"image/vnd.net-fpx": {
		source: "iana",
		extensions: [
			"npx"
		]
	},
		"image/vnd.radiance": {
		source: "iana"
	},
		"image/vnd.sealed.png": {
		source: "iana"
	},
		"image/vnd.sealedmedia.softseal.gif": {
		source: "iana"
	},
		"image/vnd.sealedmedia.softseal.jpg": {
		source: "iana"
	},
		"image/vnd.svf": {
		source: "iana"
	},
		"image/vnd.tencent.tap": {
		source: "iana"
	},
		"image/vnd.valve.source.texture": {
		source: "iana"
	},
		"image/vnd.wap.wbmp": {
		source: "iana",
		extensions: [
			"wbmp"
		]
	},
		"image/vnd.xiff": {
		source: "iana",
		extensions: [
			"xif"
		]
	},
		"image/vnd.zbrush.pcx": {
		source: "iana"
	},
		"image/webp": {
		source: "apache",
		extensions: [
			"webp"
		]
	},
		"image/wmf": {
		source: "iana"
	},
		"image/x-3ds": {
		source: "apache",
		extensions: [
			"3ds"
		]
	},
		"image/x-cmu-raster": {
		source: "apache",
		extensions: [
			"ras"
		]
	},
		"image/x-cmx": {
		source: "apache",
		extensions: [
			"cmx"
		]
	},
		"image/x-freehand": {
		source: "apache",
		extensions: [
			"fh",
			"fhc",
			"fh4",
			"fh5",
			"fh7"
		]
	},
		"image/x-icon": {
		source: "apache",
		compressible: true,
		extensions: [
			"ico"
		]
	},
		"image/x-jng": {
		source: "nginx",
		extensions: [
			"jng"
		]
	},
		"image/x-mrsid-image": {
		source: "apache",
		extensions: [
			"sid"
		]
	},
		"image/x-ms-bmp": {
		source: "nginx",
		compressible: true,
		extensions: [
			"bmp"
		]
	},
		"image/x-pcx": {
		source: "apache",
		extensions: [
			"pcx"
		]
	},
		"image/x-pict": {
		source: "apache",
		extensions: [
			"pic",
			"pct"
		]
	},
		"image/x-portable-anymap": {
		source: "apache",
		extensions: [
			"pnm"
		]
	},
		"image/x-portable-bitmap": {
		source: "apache",
		extensions: [
			"pbm"
		]
	},
		"image/x-portable-graymap": {
		source: "apache",
		extensions: [
			"pgm"
		]
	},
		"image/x-portable-pixmap": {
		source: "apache",
		extensions: [
			"ppm"
		]
	},
		"image/x-rgb": {
		source: "apache",
		extensions: [
			"rgb"
		]
	},
		"image/x-tga": {
		source: "apache",
		extensions: [
			"tga"
		]
	},
		"image/x-xbitmap": {
		source: "apache",
		extensions: [
			"xbm"
		]
	},
		"image/x-xcf": {
		compressible: false
	},
		"image/x-xpixmap": {
		source: "apache",
		extensions: [
			"xpm"
		]
	},
		"image/x-xwindowdump": {
		source: "apache",
		extensions: [
			"xwd"
		]
	},
		"message/cpim": {
		source: "iana"
	},
		"message/delivery-status": {
		source: "iana"
	},
		"message/disposition-notification": {
		source: "iana",
		extensions: [
			"disposition-notification"
		]
	},
		"message/external-body": {
		source: "iana"
	},
		"message/feedback-report": {
		source: "iana"
	},
		"message/global": {
		source: "iana",
		extensions: [
			"u8msg"
		]
	},
		"message/global-delivery-status": {
		source: "iana",
		extensions: [
			"u8dsn"
		]
	},
		"message/global-disposition-notification": {
		source: "iana",
		extensions: [
			"u8mdn"
		]
	},
		"message/global-headers": {
		source: "iana",
		extensions: [
			"u8hdr"
		]
	},
		"message/http": {
		source: "iana",
		compressible: false
	},
		"message/imdn+xml": {
		source: "iana",
		compressible: true
	},
		"message/news": {
		source: "iana"
	},
		"message/partial": {
		source: "iana",
		compressible: false
	},
		"message/rfc822": {
		source: "iana",
		compressible: true,
		extensions: [
			"eml",
			"mime"
		]
	},
		"message/s-http": {
		source: "iana"
	},
		"message/sip": {
		source: "iana"
	},
		"message/sipfrag": {
		source: "iana"
	},
		"message/tracking-status": {
		source: "iana"
	},
		"message/vnd.si.simp": {
		source: "iana"
	},
		"message/vnd.wfa.wsc": {
		source: "iana",
		extensions: [
			"wsc"
		]
	},
		"model/3mf": {
		source: "iana"
	},
		"model/gltf+json": {
		source: "iana",
		compressible: true,
		extensions: [
			"gltf"
		]
	},
		"model/gltf-binary": {
		source: "iana",
		compressible: true,
		extensions: [
			"glb"
		]
	},
		"model/iges": {
		source: "iana",
		compressible: false,
		extensions: [
			"igs",
			"iges"
		]
	},
		"model/mesh": {
		source: "iana",
		compressible: false,
		extensions: [
			"msh",
			"mesh",
			"silo"
		]
	},
		"model/stl": {
		source: "iana"
	},
		"model/vnd.collada+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"dae"
		]
	},
		"model/vnd.dwf": {
		source: "iana",
		extensions: [
			"dwf"
		]
	},
		"model/vnd.flatland.3dml": {
		source: "iana"
	},
		"model/vnd.gdl": {
		source: "iana",
		extensions: [
			"gdl"
		]
	},
		"model/vnd.gs-gdl": {
		source: "apache"
	},
		"model/vnd.gs.gdl": {
		source: "iana"
	},
		"model/vnd.gtw": {
		source: "iana",
		extensions: [
			"gtw"
		]
	},
		"model/vnd.moml+xml": {
		source: "iana",
		compressible: true
	},
		"model/vnd.mts": {
		source: "iana",
		extensions: [
			"mts"
		]
	},
		"model/vnd.opengex": {
		source: "iana"
	},
		"model/vnd.parasolid.transmit.binary": {
		source: "iana"
	},
		"model/vnd.parasolid.transmit.text": {
		source: "iana"
	},
		"model/vnd.rosette.annotated-data-model": {
		source: "iana"
	},
		"model/vnd.usdz+zip": {
		source: "iana",
		compressible: false
	},
		"model/vnd.valve.source.compiled-map": {
		source: "iana"
	},
		"model/vnd.vtu": {
		source: "iana",
		extensions: [
			"vtu"
		]
	},
		"model/vrml": {
		source: "iana",
		compressible: false,
		extensions: [
			"wrl",
			"vrml"
		]
	},
		"model/x3d+binary": {
		source: "apache",
		compressible: false,
		extensions: [
			"x3db",
			"x3dbz"
		]
	},
		"model/x3d+fastinfoset": {
		source: "iana"
	},
		"model/x3d+vrml": {
		source: "apache",
		compressible: false,
		extensions: [
			"x3dv",
			"x3dvz"
		]
	},
		"model/x3d+xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"x3d",
			"x3dz"
		]
	},
		"model/x3d-vrml": {
		source: "iana"
	},
		"multipart/alternative": {
		source: "iana",
		compressible: false
	},
		"multipart/appledouble": {
		source: "iana"
	},
		"multipart/byteranges": {
		source: "iana"
	},
		"multipart/digest": {
		source: "iana"
	},
		"multipart/encrypted": {
		source: "iana",
		compressible: false
	},
		"multipart/form-data": {
		source: "iana",
		compressible: false
	},
		"multipart/header-set": {
		source: "iana"
	},
		"multipart/mixed": {
		source: "iana",
		compressible: false
	},
		"multipart/multilingual": {
		source: "iana"
	},
		"multipart/parallel": {
		source: "iana"
	},
		"multipart/related": {
		source: "iana",
		compressible: false
	},
		"multipart/report": {
		source: "iana"
	},
		"multipart/signed": {
		source: "iana",
		compressible: false
	},
		"multipart/vnd.bint.med-plus": {
		source: "iana"
	},
		"multipart/voice-message": {
		source: "iana"
	},
		"multipart/x-mixed-replace": {
		source: "iana"
	},
		"text/1d-interleaved-parityfec": {
		source: "iana"
	},
		"text/cache-manifest": {
		source: "iana",
		compressible: true,
		extensions: [
			"appcache",
			"manifest"
		]
	},
		"text/calendar": {
		source: "iana",
		extensions: [
			"ics",
			"ifb"
		]
	},
		"text/calender": {
		compressible: true
	},
		"text/cmd": {
		compressible: true
	},
		"text/coffeescript": {
		extensions: [
			"coffee",
			"litcoffee"
		]
	},
		"text/css": {
		source: "iana",
		charset: "UTF-8",
		compressible: true,
		extensions: [
			"css"
		]
	},
		"text/csv": {
		source: "iana",
		compressible: true,
		extensions: [
			"csv"
		]
	},
		"text/csv-schema": {
		source: "iana"
	},
		"text/directory": {
		source: "iana"
	},
		"text/dns": {
		source: "iana"
	},
		"text/ecmascript": {
		source: "iana"
	},
		"text/encaprtp": {
		source: "iana"
	},
		"text/enriched": {
		source: "iana"
	},
		"text/fwdred": {
		source: "iana"
	},
		"text/grammar-ref-list": {
		source: "iana"
	},
		"text/html": {
		source: "iana",
		compressible: true,
		extensions: [
			"html",
			"htm",
			"shtml"
		]
	},
		"text/jade": {
		extensions: [
			"jade"
		]
	},
		"text/javascript": {
		source: "iana",
		compressible: true
	},
		"text/jcr-cnd": {
		source: "iana"
	},
		"text/jsx": {
		compressible: true,
		extensions: [
			"jsx"
		]
	},
		"text/less": {
		extensions: [
			"less"
		]
	},
		"text/markdown": {
		source: "iana",
		compressible: true,
		extensions: [
			"markdown",
			"md"
		]
	},
		"text/mathml": {
		source: "nginx",
		extensions: [
			"mml"
		]
	},
		"text/mizar": {
		source: "iana"
	},
		"text/n3": {
		source: "iana",
		compressible: true,
		extensions: [
			"n3"
		]
	},
		"text/parameters": {
		source: "iana"
	},
		"text/parityfec": {
		source: "iana"
	},
		"text/plain": {
		source: "iana",
		compressible: true,
		extensions: [
			"txt",
			"text",
			"conf",
			"def",
			"list",
			"log",
			"in",
			"ini"
		]
	},
		"text/provenance-notation": {
		source: "iana"
	},
		"text/prs.fallenstein.rst": {
		source: "iana"
	},
		"text/prs.lines.tag": {
		source: "iana",
		extensions: [
			"dsc"
		]
	},
		"text/prs.prop.logic": {
		source: "iana"
	},
		"text/raptorfec": {
		source: "iana"
	},
		"text/red": {
		source: "iana"
	},
		"text/rfc822-headers": {
		source: "iana"
	},
		"text/richtext": {
		source: "iana",
		compressible: true,
		extensions: [
			"rtx"
		]
	},
		"text/rtf": {
		source: "iana",
		compressible: true,
		extensions: [
			"rtf"
		]
	},
		"text/rtp-enc-aescm128": {
		source: "iana"
	},
		"text/rtploopback": {
		source: "iana"
	},
		"text/rtx": {
		source: "iana"
	},
		"text/sgml": {
		source: "iana",
		extensions: [
			"sgml",
			"sgm"
		]
	},
		"text/shex": {
		extensions: [
			"shex"
		]
	},
		"text/slim": {
		extensions: [
			"slim",
			"slm"
		]
	},
		"text/strings": {
		source: "iana"
	},
		"text/stylus": {
		extensions: [
			"stylus",
			"styl"
		]
	},
		"text/t140": {
		source: "iana"
	},
		"text/tab-separated-values": {
		source: "iana",
		compressible: true,
		extensions: [
			"tsv"
		]
	},
		"text/troff": {
		source: "iana",
		extensions: [
			"t",
			"tr",
			"roff",
			"man",
			"me",
			"ms"
		]
	},
		"text/turtle": {
		source: "iana",
		charset: "UTF-8",
		extensions: [
			"ttl"
		]
	},
		"text/ulpfec": {
		source: "iana"
	},
		"text/uri-list": {
		source: "iana",
		compressible: true,
		extensions: [
			"uri",
			"uris",
			"urls"
		]
	},
		"text/vcard": {
		source: "iana",
		compressible: true,
		extensions: [
			"vcard"
		]
	},
		"text/vnd.a": {
		source: "iana"
	},
		"text/vnd.abc": {
		source: "iana"
	},
		"text/vnd.ascii-art": {
		source: "iana"
	},
		"text/vnd.curl": {
		source: "iana",
		extensions: [
			"curl"
		]
	},
		"text/vnd.curl.dcurl": {
		source: "apache",
		extensions: [
			"dcurl"
		]
	},
		"text/vnd.curl.mcurl": {
		source: "apache",
		extensions: [
			"mcurl"
		]
	},
		"text/vnd.curl.scurl": {
		source: "apache",
		extensions: [
			"scurl"
		]
	},
		"text/vnd.debian.copyright": {
		source: "iana"
	},
		"text/vnd.dmclientscript": {
		source: "iana"
	},
		"text/vnd.dvb.subtitle": {
		source: "iana",
		extensions: [
			"sub"
		]
	},
		"text/vnd.esmertec.theme-descriptor": {
		source: "iana"
	},
		"text/vnd.fly": {
		source: "iana",
		extensions: [
			"fly"
		]
	},
		"text/vnd.fmi.flexstor": {
		source: "iana",
		extensions: [
			"flx"
		]
	},
		"text/vnd.gml": {
		source: "iana"
	},
		"text/vnd.graphviz": {
		source: "iana",
		extensions: [
			"gv"
		]
	},
		"text/vnd.hgl": {
		source: "iana"
	},
		"text/vnd.in3d.3dml": {
		source: "iana",
		extensions: [
			"3dml"
		]
	},
		"text/vnd.in3d.spot": {
		source: "iana",
		extensions: [
			"spot"
		]
	},
		"text/vnd.iptc.newsml": {
		source: "iana"
	},
		"text/vnd.iptc.nitf": {
		source: "iana"
	},
		"text/vnd.latex-z": {
		source: "iana"
	},
		"text/vnd.motorola.reflex": {
		source: "iana"
	},
		"text/vnd.ms-mediapackage": {
		source: "iana"
	},
		"text/vnd.net2phone.commcenter.command": {
		source: "iana"
	},
		"text/vnd.radisys.msml-basic-layout": {
		source: "iana"
	},
		"text/vnd.si.uricatalogue": {
		source: "iana"
	},
		"text/vnd.sun.j2me.app-descriptor": {
		source: "iana",
		extensions: [
			"jad"
		]
	},
		"text/vnd.trolltech.linguist": {
		source: "iana"
	},
		"text/vnd.wap.si": {
		source: "iana"
	},
		"text/vnd.wap.sl": {
		source: "iana"
	},
		"text/vnd.wap.wml": {
		source: "iana",
		extensions: [
			"wml"
		]
	},
		"text/vnd.wap.wmlscript": {
		source: "iana",
		extensions: [
			"wmls"
		]
	},
		"text/vtt": {
		charset: "UTF-8",
		compressible: true,
		extensions: [
			"vtt"
		]
	},
		"text/x-asm": {
		source: "apache",
		extensions: [
			"s",
			"asm"
		]
	},
		"text/x-c": {
		source: "apache",
		extensions: [
			"c",
			"cc",
			"cxx",
			"cpp",
			"h",
			"hh",
			"dic"
		]
	},
		"text/x-component": {
		source: "nginx",
		extensions: [
			"htc"
		]
	},
		"text/x-fortran": {
		source: "apache",
		extensions: [
			"f",
			"for",
			"f77",
			"f90"
		]
	},
		"text/x-gwt-rpc": {
		compressible: true
	},
		"text/x-handlebars-template": {
		extensions: [
			"hbs"
		]
	},
		"text/x-java-source": {
		source: "apache",
		extensions: [
			"java"
		]
	},
		"text/x-jquery-tmpl": {
		compressible: true
	},
		"text/x-lua": {
		extensions: [
			"lua"
		]
	},
		"text/x-markdown": {
		compressible: true,
		extensions: [
			"mkd"
		]
	},
		"text/x-nfo": {
		source: "apache",
		extensions: [
			"nfo"
		]
	},
		"text/x-opml": {
		source: "apache",
		extensions: [
			"opml"
		]
	},
		"text/x-org": {
		compressible: true,
		extensions: [
			"org"
		]
	},
		"text/x-pascal": {
		source: "apache",
		extensions: [
			"p",
			"pas"
		]
	},
		"text/x-processing": {
		compressible: true,
		extensions: [
			"pde"
		]
	},
		"text/x-sass": {
		extensions: [
			"sass"
		]
	},
		"text/x-scss": {
		extensions: [
			"scss"
		]
	},
		"text/x-setext": {
		source: "apache",
		extensions: [
			"etx"
		]
	},
		"text/x-sfv": {
		source: "apache",
		extensions: [
			"sfv"
		]
	},
		"text/x-suse-ymp": {
		compressible: true,
		extensions: [
			"ymp"
		]
	},
		"text/x-uuencode": {
		source: "apache",
		extensions: [
			"uu"
		]
	},
		"text/x-vcalendar": {
		source: "apache",
		extensions: [
			"vcs"
		]
	},
		"text/x-vcard": {
		source: "apache",
		extensions: [
			"vcf"
		]
	},
		"text/xml": {
		source: "iana",
		compressible: true,
		extensions: [
			"xml"
		]
	},
		"text/xml-external-parsed-entity": {
		source: "iana"
	},
		"text/yaml": {
		extensions: [
			"yaml",
			"yml"
		]
	},
		"video/1d-interleaved-parityfec": {
		source: "iana"
	},
		"video/3gpp": {
		source: "iana",
		extensions: [
			"3gp",
			"3gpp"
		]
	},
		"video/3gpp-tt": {
		source: "iana"
	},
		"video/3gpp2": {
		source: "iana",
		extensions: [
			"3g2"
		]
	},
		"video/bmpeg": {
		source: "iana"
	},
		"video/bt656": {
		source: "iana"
	},
		"video/celb": {
		source: "iana"
	},
		"video/dv": {
		source: "iana"
	},
		"video/encaprtp": {
		source: "iana"
	},
		"video/h261": {
		source: "iana",
		extensions: [
			"h261"
		]
	},
		"video/h263": {
		source: "iana",
		extensions: [
			"h263"
		]
	},
		"video/h263-1998": {
		source: "iana"
	},
		"video/h263-2000": {
		source: "iana"
	},
		"video/h264": {
		source: "iana",
		extensions: [
			"h264"
		]
	},
		"video/h264-rcdo": {
		source: "iana"
	},
		"video/h264-svc": {
		source: "iana"
	},
		"video/h265": {
		source: "iana"
	},
		"video/iso.segment": {
		source: "iana"
	},
		"video/jpeg": {
		source: "iana",
		extensions: [
			"jpgv"
		]
	},
		"video/jpeg2000": {
		source: "iana"
	},
		"video/jpm": {
		source: "apache",
		extensions: [
			"jpm",
			"jpgm"
		]
	},
		"video/mj2": {
		source: "iana",
		extensions: [
			"mj2",
			"mjp2"
		]
	},
		"video/mp1s": {
		source: "iana"
	},
		"video/mp2p": {
		source: "iana"
	},
		"video/mp2t": {
		source: "iana",
		extensions: [
			"ts"
		]
	},
		"video/mp4": {
		source: "iana",
		compressible: false,
		extensions: [
			"mp4",
			"mp4v",
			"mpg4"
		]
	},
		"video/mp4v-es": {
		source: "iana"
	},
		"video/mpeg": {
		source: "iana",
		compressible: false,
		extensions: [
			"mpeg",
			"mpg",
			"mpe",
			"m1v",
			"m2v"
		]
	},
		"video/mpeg4-generic": {
		source: "iana"
	},
		"video/mpv": {
		source: "iana"
	},
		"video/nv": {
		source: "iana"
	},
		"video/ogg": {
		source: "iana",
		compressible: false,
		extensions: [
			"ogv"
		]
	},
		"video/parityfec": {
		source: "iana"
	},
		"video/pointer": {
		source: "iana"
	},
		"video/quicktime": {
		source: "iana",
		compressible: false,
		extensions: [
			"qt",
			"mov"
		]
	},
		"video/raptorfec": {
		source: "iana"
	},
		"video/raw": {
		source: "iana"
	},
		"video/rtp-enc-aescm128": {
		source: "iana"
	},
		"video/rtploopback": {
		source: "iana"
	},
		"video/rtx": {
		source: "iana"
	},
		"video/smpte291": {
		source: "iana"
	},
		"video/smpte292m": {
		source: "iana"
	},
		"video/ulpfec": {
		source: "iana"
	},
		"video/vc1": {
		source: "iana"
	},
		"video/vnd.cctv": {
		source: "iana"
	},
		"video/vnd.dece.hd": {
		source: "iana",
		extensions: [
			"uvh",
			"uvvh"
		]
	},
		"video/vnd.dece.mobile": {
		source: "iana",
		extensions: [
			"uvm",
			"uvvm"
		]
	},
		"video/vnd.dece.mp4": {
		source: "iana"
	},
		"video/vnd.dece.pd": {
		source: "iana",
		extensions: [
			"uvp",
			"uvvp"
		]
	},
		"video/vnd.dece.sd": {
		source: "iana",
		extensions: [
			"uvs",
			"uvvs"
		]
	},
		"video/vnd.dece.video": {
		source: "iana",
		extensions: [
			"uvv",
			"uvvv"
		]
	},
		"video/vnd.directv.mpeg": {
		source: "iana"
	},
		"video/vnd.directv.mpeg-tts": {
		source: "iana"
	},
		"video/vnd.dlna.mpeg-tts": {
		source: "iana"
	},
		"video/vnd.dvb.file": {
		source: "iana",
		extensions: [
			"dvb"
		]
	},
		"video/vnd.fvt": {
		source: "iana",
		extensions: [
			"fvt"
		]
	},
		"video/vnd.hns.video": {
		source: "iana"
	},
		"video/vnd.iptvforum.1dparityfec-1010": {
		source: "iana"
	},
		"video/vnd.iptvforum.1dparityfec-2005": {
		source: "iana"
	},
		"video/vnd.iptvforum.2dparityfec-1010": {
		source: "iana"
	},
		"video/vnd.iptvforum.2dparityfec-2005": {
		source: "iana"
	},
		"video/vnd.iptvforum.ttsavc": {
		source: "iana"
	},
		"video/vnd.iptvforum.ttsmpeg2": {
		source: "iana"
	},
		"video/vnd.motorola.video": {
		source: "iana"
	},
		"video/vnd.motorola.videop": {
		source: "iana"
	},
		"video/vnd.mpegurl": {
		source: "iana",
		extensions: [
			"mxu",
			"m4u"
		]
	},
		"video/vnd.ms-playready.media.pyv": {
		source: "iana",
		extensions: [
			"pyv"
		]
	},
		"video/vnd.nokia.interleaved-multimedia": {
		source: "iana"
	},
		"video/vnd.nokia.mp4vr": {
		source: "iana"
	},
		"video/vnd.nokia.videovoip": {
		source: "iana"
	},
		"video/vnd.objectvideo": {
		source: "iana"
	},
		"video/vnd.radgamettools.bink": {
		source: "iana"
	},
		"video/vnd.radgamettools.smacker": {
		source: "iana"
	},
		"video/vnd.sealed.mpeg1": {
		source: "iana"
	},
		"video/vnd.sealed.mpeg4": {
		source: "iana"
	},
		"video/vnd.sealed.swf": {
		source: "iana"
	},
		"video/vnd.sealedmedia.softseal.mov": {
		source: "iana"
	},
		"video/vnd.uvvu.mp4": {
		source: "iana",
		extensions: [
			"uvu",
			"uvvu"
		]
	},
		"video/vnd.vivo": {
		source: "iana",
		extensions: [
			"viv"
		]
	},
		"video/vp8": {
		source: "iana"
	},
		"video/webm": {
		source: "apache",
		compressible: false,
		extensions: [
			"webm"
		]
	},
		"video/x-f4v": {
		source: "apache",
		extensions: [
			"f4v"
		]
	},
		"video/x-fli": {
		source: "apache",
		extensions: [
			"fli"
		]
	},
		"video/x-flv": {
		source: "apache",
		compressible: false,
		extensions: [
			"flv"
		]
	},
		"video/x-m4v": {
		source: "apache",
		extensions: [
			"m4v"
		]
	},
		"video/x-matroska": {
		source: "apache",
		compressible: false,
		extensions: [
			"mkv",
			"mk3d",
			"mks"
		]
	},
		"video/x-mng": {
		source: "apache",
		extensions: [
			"mng"
		]
	},
		"video/x-ms-asf": {
		source: "apache",
		extensions: [
			"asf",
			"asx"
		]
	},
		"video/x-ms-vob": {
		source: "apache",
		extensions: [
			"vob"
		]
	},
		"video/x-ms-wm": {
		source: "apache",
		extensions: [
			"wm"
		]
	},
		"video/x-ms-wmv": {
		source: "apache",
		compressible: false,
		extensions: [
			"wmv"
		]
	},
		"video/x-ms-wmx": {
		source: "apache",
		extensions: [
			"wmx"
		]
	},
		"video/x-ms-wvx": {
		source: "apache",
		extensions: [
			"wvx"
		]
	},
		"video/x-msvideo": {
		source: "apache",
		extensions: [
			"avi"
		]
	},
		"video/x-sgi-movie": {
		source: "apache",
		extensions: [
			"movie"
		]
	},
		"video/x-smv": {
		source: "apache",
		extensions: [
			"smv"
		]
	},
		"x-conference/x-cooltalk": {
		source: "apache",
		extensions: [
			"ice"
		]
	},
		"x-shader/x-fragment": {
		compressible: true
	},
		"x-shader/x-vertex": {
		compressible: true
	}
	};

	var db$1 = /*#__PURE__*/Object.freeze({
		default: db
	});

	var require$$0 = ( db$1 && db ) || db$1;

	/*!
	 * mime-db
	 * Copyright(c) 2014 Jonathan Ong
	 * MIT Licensed
	 */

	/**
	 * Module exports.
	 */

	var mimeDb = require$$0;

	// Copyright Joyent, Inc. and other Node contributors.
	//
	// Permission is hereby granted, free of charge, to any person obtaining a
	// copy of this software and associated documentation files (the
	// "Software"), to deal in the Software without restriction, including
	// without limitation the rights to use, copy, modify, merge, publish,
	// distribute, sublicense, and/or sell copies of the Software, and to permit
	// persons to whom the Software is furnished to do so, subject to the
	// following conditions:
	//
	// The above copyright notice and this permission notice shall be included
	// in all copies or substantial portions of the Software.
	//
	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	// USE OR OTHER DEALINGS IN THE SOFTWARE.

	// resolves . and .. elements in a path array with directory names there
	// must be no slashes, empty elements, or device names (c:\) in the array
	// (so also no leading and trailing slashes - it does not distinguish
	// relative and absolute paths)
	function normalizeArray(parts, allowAboveRoot) {
	  // if the path tries to go above the root, `up` ends up > 0
	  var up = 0;
	  for (var i = parts.length - 1; i >= 0; i--) {
	    var last = parts[i];
	    if (last === '.') {
	      parts.splice(i, 1);
	    } else if (last === '..') {
	      parts.splice(i, 1);
	      up++;
	    } else if (up) {
	      parts.splice(i, 1);
	      up--;
	    }
	  }

	  // if the path is allowed to go above the root, restore leading ..s
	  if (allowAboveRoot) {
	    for (; up--; up) {
	      parts.unshift('..');
	    }
	  }

	  return parts;
	}

	// Split a filename into [root, dir, basename, ext], unix version
	// 'root' is just a slash, or nothing.
	var splitPathRe =
	    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
	var splitPath = function(filename) {
	  return splitPathRe.exec(filename).slice(1);
	};

	// path.resolve([from ...], to)
	// posix version
	function resolve() {
	  var resolvedPath = '',
	      resolvedAbsolute = false;

	  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
	    var path = (i >= 0) ? arguments[i] : '/';

	    // Skip empty and invalid entries
	    if (typeof path !== 'string') {
	      throw new TypeError('Arguments to path.resolve must be strings');
	    } else if (!path) {
	      continue;
	    }

	    resolvedPath = path + '/' + resolvedPath;
	    resolvedAbsolute = path.charAt(0) === '/';
	  }

	  // At this point the path should be resolved to a full absolute path, but
	  // handle relative paths to be safe (might happen when process.cwd() fails)

	  // Normalize the path
	  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
	    return !!p;
	  }), !resolvedAbsolute).join('/');

	  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
	}
	// path.normalize(path)
	// posix version
	function normalize(path) {
	  var isPathAbsolute = isAbsolute(path),
	      trailingSlash = substr(path, -1) === '/';

	  // Normalize the path
	  path = normalizeArray(filter(path.split('/'), function(p) {
	    return !!p;
	  }), !isPathAbsolute).join('/');

	  if (!path && !isPathAbsolute) {
	    path = '.';
	  }
	  if (path && trailingSlash) {
	    path += '/';
	  }

	  return (isPathAbsolute ? '/' : '') + path;
	}
	// posix version
	function isAbsolute(path) {
	  return path.charAt(0) === '/';
	}

	// posix version
	function join() {
	  var paths = Array.prototype.slice.call(arguments, 0);
	  return normalize(filter(paths, function(p, index) {
	    if (typeof p !== 'string') {
	      throw new TypeError('Arguments to path.join must be strings');
	    }
	    return p;
	  }).join('/'));
	}


	// path.relative(from, to)
	// posix version
	function relative(from, to) {
	  from = resolve(from).substr(1);
	  to = resolve(to).substr(1);

	  function trim(arr) {
	    var start = 0;
	    for (; start < arr.length; start++) {
	      if (arr[start] !== '') break;
	    }

	    var end = arr.length - 1;
	    for (; end >= 0; end--) {
	      if (arr[end] !== '') break;
	    }

	    if (start > end) return [];
	    return arr.slice(start, end - start + 1);
	  }

	  var fromParts = trim(from.split('/'));
	  var toParts = trim(to.split('/'));

	  var length = Math.min(fromParts.length, toParts.length);
	  var samePartsLength = length;
	  for (var i = 0; i < length; i++) {
	    if (fromParts[i] !== toParts[i]) {
	      samePartsLength = i;
	      break;
	    }
	  }

	  var outputParts = [];
	  for (var i = samePartsLength; i < fromParts.length; i++) {
	    outputParts.push('..');
	  }

	  outputParts = outputParts.concat(toParts.slice(samePartsLength));

	  return outputParts.join('/');
	}

	var sep = '/';
	var delimiter$1 = ':';

	function dirname(path) {
	  var result = splitPath(path),
	      root = result[0],
	      dir = result[1];

	  if (!root && !dir) {
	    // No dirname whatsoever
	    return '.';
	  }

	  if (dir) {
	    // It has a dirname, strip trailing slash
	    dir = dir.substr(0, dir.length - 1);
	  }

	  return root + dir;
	}

	function basename(path, ext) {
	  var f = splitPath(path)[2];
	  // TODO: make this comparison case-insensitive on windows?
	  if (ext && f.substr(-1 * ext.length) === ext) {
	    f = f.substr(0, f.length - ext.length);
	  }
	  return f;
	}


	function extname(path) {
	  return splitPath(path)[3];
	}
	var path = {
	  extname: extname,
	  basename: basename,
	  dirname: dirname,
	  sep: sep,
	  delimiter: delimiter$1,
	  relative: relative,
	  join: join,
	  isAbsolute: isAbsolute,
	  normalize: normalize,
	  resolve: resolve
	};
	function filter (xs, f) {
	    if (xs.filter) return xs.filter(f);
	    var res = [];
	    for (var i = 0; i < xs.length; i++) {
	        if (f(xs[i], i, xs)) res.push(xs[i]);
	    }
	    return res;
	}

	// String.prototype.substr - negative index don't work in IE8
	var substr = 'ab'.substr(-1) === 'b' ?
	    function (str, start, len) { return str.substr(start, len) } :
	    function (str, start, len) {
	        if (start < 0) start = str.length + start;
	        return str.substr(start, len);
	    }
	;

	var path$1 = /*#__PURE__*/Object.freeze({
		resolve: resolve,
		normalize: normalize,
		isAbsolute: isAbsolute,
		join: join,
		relative: relative,
		sep: sep,
		delimiter: delimiter$1,
		dirname: dirname,
		basename: basename,
		extname: extname,
		default: path
	});

	var require$$0$1 = ( path$1 && path ) || path$1;

	var mimeTypes = createCommonjsModule(function (module, exports) {

	/**
	 * Module dependencies.
	 * @private
	 */


	var extname = require$$0$1.extname;

	/**
	 * Module variables.
	 * @private
	 */

	var EXTRACT_TYPE_REGEXP = /^\s*([^;\s]*)(?:;|\s|$)/;
	var TEXT_TYPE_REGEXP = /^text\//i;

	/**
	 * Module exports.
	 * @public
	 */

	exports.charset = charset;
	exports.charsets = { lookup: charset };
	exports.contentType = contentType;
	exports.extension = extension;
	exports.extensions = Object.create(null);
	exports.lookup = lookup;
	exports.types = Object.create(null);

	// Populate the extensions/types maps
	populateMaps(exports.extensions, exports.types);

	/**
	 * Get the default charset for a MIME type.
	 *
	 * @param {string} type
	 * @return {boolean|string}
	 */

	function charset (type) {
	  if (!type || typeof type !== 'string') {
	    return false
	  }

	  // TODO: use media-typer
	  var match = EXTRACT_TYPE_REGEXP.exec(type);
	  var mime = match && mimeDb[match[1].toLowerCase()];

	  if (mime && mime.charset) {
	    return mime.charset
	  }

	  // default text/* to utf-8
	  if (match && TEXT_TYPE_REGEXP.test(match[1])) {
	    return 'UTF-8'
	  }

	  return false
	}

	/**
	 * Create a full Content-Type header given a MIME type or extension.
	 *
	 * @param {string} str
	 * @return {boolean|string}
	 */

	function contentType (str) {
	  // TODO: should this even be in this module?
	  if (!str || typeof str !== 'string') {
	    return false
	  }

	  var mime = str.indexOf('/') === -1
	    ? exports.lookup(str)
	    : str;

	  if (!mime) {
	    return false
	  }

	  // TODO: use content-type or other module
	  if (mime.indexOf('charset') === -1) {
	    var charset = exports.charset(mime);
	    if (charset) mime += '; charset=' + charset.toLowerCase();
	  }

	  return mime
	}

	/**
	 * Get the default extension for a MIME type.
	 *
	 * @param {string} type
	 * @return {boolean|string}
	 */

	function extension (type) {
	  if (!type || typeof type !== 'string') {
	    return false
	  }

	  // TODO: use media-typer
	  var match = EXTRACT_TYPE_REGEXP.exec(type);

	  // get extensions
	  var exts = match && exports.extensions[match[1].toLowerCase()];

	  if (!exts || !exts.length) {
	    return false
	  }

	  return exts[0]
	}

	/**
	 * Lookup the MIME type for a file path/extension.
	 *
	 * @param {string} path
	 * @return {boolean|string}
	 */

	function lookup (path) {
	  if (!path || typeof path !== 'string') {
	    return false
	  }

	  // get the extension ("ext" or ".ext" or full path)
	  var extension = extname('x.' + path)
	    .toLowerCase()
	    .substr(1);

	  if (!extension) {
	    return false
	  }

	  return exports.types[extension] || false
	}

	/**
	 * Populate the extensions and types maps.
	 * @private
	 */

	function populateMaps (extensions, types) {
	  // source preference (least -> most)
	  var preference = ['nginx', 'apache', undefined, 'iana'];

	  Object.keys(mimeDb).forEach(function forEachMimeType (type) {
	    var mime = mimeDb[type];
	    var exts = mime.extensions;

	    if (!exts || !exts.length) {
	      return
	    }

	    // mime -> extensions
	    extensions[type] = exts;

	    // extension -> mime
	    for (var i = 0; i < exts.length; i++) {
	      var extension = exts[i];

	      if (types[extension]) {
	        var from = preference.indexOf(mimeDb[types[extension]].source);
	        var to = preference.indexOf(mime.source);

	        if (types[extension] !== 'application/octet-stream' &&
	          (from > to || (from === to && types[extension].substr(0, 12) === 'application/'))) {
	          // skip the remapping
	          continue
	        }
	      }

	      // set the extension -> mime
	      types[extension] = type;
	    }
	  });
	}
	});
	var mimeTypes_1 = mimeTypes.charset;
	var mimeTypes_2 = mimeTypes.charsets;
	var mimeTypes_3 = mimeTypes.contentType;
	var mimeTypes_4 = mimeTypes.extension;
	var mimeTypes_5 = mimeTypes.extensions;
	var mimeTypes_6 = mimeTypes.lookup;
	var mimeTypes_7 = mimeTypes.types;

	var require$$0$2 = ( url$1 && url ) || url$1;

	var punycode$1 = ( punycode_es6 && punycode ) || punycode_es6;

	const {URL} = require$$0$2;



	/**
	 * Translates the canonicalUrl to the AMP Cache equivalent, for a given AMP Cache.
	 * @param {string} domainSuffix the AMP Cache domain suffix
	 * @param {string} url the canonical URL
	 */
	function createCacheUrl(domainSuffix, url) {
	  const cacheUrl = new URL(url);
	  const originalHostname = cacheUrl.hostname;
	  let unicodeHostname = punycode$1.toUnicode(originalHostname);
	  unicodeHostname = unicodeHostname.replace(/-/g, '--');
	  unicodeHostname = unicodeHostname.replace(/\./g, '-');

	  let pathSegment = _getResourcePath(cacheUrl.pathname);
	  pathSegment += cacheUrl.protocol === 'https:' ? '/s/' : '/';

	  cacheUrl.protocol = 'https';
	  cacheUrl.hostname = punycode$1.toASCII(unicodeHostname) + '.' + domainSuffix;
	  cacheUrl.pathname = pathSegment + originalHostname + cacheUrl.pathname;
	  return cacheUrl.toString();
	}

	/**
	 * Returns the AMP Cache path, based on the mime type of the file that is being loaded.
	 * @param {string} pathname the pathname on the canonical url.
	 */
	function _getResourcePath(pathname) {
	  const mimetype = mimeTypes.lookup(pathname);
	  if (!mimetype) {
	    return '/c';
	  }

	  if (mimetype.indexOf('image/') === 0) {
	    return '/i';
	  }

	  if (mimetype.indexOf('font') >= 0) {
	    return '/r';
	  }

	  // Default to document
	  return '/c';
	}

	/** @module AmpUrl */
	var AmpCacheUrlGenerator = createCacheUrl;

	/** @module AmpUrl */
	var cacheUrl = AmpCacheUrlGenerator;

	return cacheUrl;

})));
