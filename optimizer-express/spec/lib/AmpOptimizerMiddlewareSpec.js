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

const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');
const AmpOptimizerMiddleware = require('../../lib/AmpOptimizeMiddleware.js');

class TestTransformer {
  transformHtml(body, options) {
    return Promise.resolve('transformed: ' + options.ampUrl);
  }
}

function runMiddlewareForUrl(middleware, url, accepts = () => 'html') {
  return new Promise((resolve) => {
    const mockResponse = new MockExpressResponse();
    const next = () => mockResponse.send('original');
    const mockRequest = new MockExpressRequest({
      url: url,
    });
    mockRequest.accepts = accepts;

    const end = mockResponse.end;
    mockResponse.end = (chunks) => {
      mockResponse.end = end;
      mockResponse.end(chunks);
      resolve(mockResponse._getString());
    };
    middleware(mockRequest, mockResponse, next);
  });
}

describe('Express Middleware', () => {
  describe('Default configuration', () => {
    const middleware = AmpOptimizerMiddleware.create({ampOptimizer: new TestTransformer()});

    it('Transforms URLs', () => {
      runMiddlewareForUrl(middleware, '/stuff?q=thing')
          .then((result) => {
            expect(result).toEqual('transformed: /stuff?q=thing&amp=');
          });
    });

    it('Skips Urls starting the "amp" query parameter', () => {
      runMiddlewareForUrl(middleware, '/stuff?q=thing&amp')
          .then((result) => {
            expect(result).toEqual('original');
          });
    });

    const runStaticTest = (url, expected) => {
      runMiddlewareForUrl(middleware, url)
          .then((result) => {
            expect(result).toEqual(expected);
          });
    };

    ['/image.jpg', '/image.svg', '/script.js', '/style.css'].forEach((url) => {
      it(`Does not transform ${url}`, () => runStaticTest(url, 'original'));
    });

    ['/', '/path.com/', '', 'path.jpg/'].forEach((url) => {
      it(`Transforms path url ${url}`, () => runStaticTest(url, `transformed: ${url}?amp=`));
    });

    it('Applies transformation if req.accept method does not exist', () => {
      runMiddlewareForUrl(middleware, '/page.html', null)
          .then((result) => {
            expect(result).toEqual('transformed: /page.html?amp=');
          });
    });

    it('Skips transformation if request does not accept HTML', () => {
      runMiddlewareForUrl(middleware, '/page.html', () => '')
          .then((result) => {
            expect(result).toEqual('original');
          });
    });
  });

  describe('Handles transformation errors', () => {
    const transformer = {
      transformHtml: () => Promise.reject('error'),
    };

    const middleware = AmpOptimizerMiddleware.create({ampOptimizer: transformer});

    it('Sends the original content when optimizer fails', () => {
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toEqual('original');
          });
    });
  });

  describe('options.runtimeVersion', () => {
    const transformer = {
      transformHtml: (body, options) => Promise.resolve(options.ampRuntimeVersion || ''),
    };

    it('Default runtimeVersion is null', () => {
      const middleware = AmpOptimizerMiddleware.create({ampOptimizer: transformer});
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toBe('');
          });
    });

    it('Uses runtimeVersion when set', () => {
      const runtimeVersion = (() => Promise.resolve('1'));
      const middleware = AmpOptimizerMiddleware.create({
        ampOptimizer: transformer,
        runtimeVersion: runtimeVersion,
      });
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toBe('1');
          });
    });

    it('Uses null if runtimeVersion fails', () => {
      const runtimeVersion = (() => Promise.reject('error'));
      const middleware = AmpOptimizerMiddleware.create({
        ampOptimizer: transformer,
        runtimeVersion: runtimeVersion,
      });
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toBe('');
          });
    });
  });
});
