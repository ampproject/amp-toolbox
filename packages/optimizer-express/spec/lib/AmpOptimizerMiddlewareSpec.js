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

const AMP_DOC = '<html amp>original</html>';

class TestTransformer {
  transformHtml(body, options) {
    return Promise.resolve('transformed: ' + options.ampUrl);
  }
}

function runMiddlewareForUrl(middleware, url, options={accepts: () => 'html', input: AMP_DOC}) {
  return new Promise((resolve) => {
    const mockResponse = new MockExpressResponse();
    const next = () => mockResponse.send(options.input);
    const mockRequest = new MockExpressRequest({
      url: url,
    });
    mockRequest.accepts = options.accepts;

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
  describe('default configuration', () => {
    const middleware = AmpOptimizerMiddleware.create({ampOptimizer: new TestTransformer()});

    it('transforms URLs', () => {
      runMiddlewareForUrl(middleware, '/stuff?q=thing')
          .then((result) => {
            expect(result).toEqual('transformed: /stuff?q=thing&amp=');
          });
    });

    it('skips URLs starting with the "amp" query parameter', () => {
      runMiddlewareForUrl(middleware, '/stuff?q=thing&amp')
          .then((result) => {
            expect(result).toEqual(AMP_DOC);
          });
    });

    const runStaticTest = (url, expected) => {
      runMiddlewareForUrl(middleware, url)
          .then((result) => {
            expect(result).toEqual(expected);
          });
    };

    ['/image.jpg', '/image.svg', '/script.js', '/style.css'].forEach((url) => {
      it(`Does not transform ${url}`, () => runStaticTest(url, AMP_DOC));
    });

    ['/', '/path.com/', '', 'path.jpg/'].forEach((url) => {
      it(`Transforms path url ${url}`, () => runStaticTest(url, `transformed: ${url}?amp=`));
    });

    it('applies transformation if req.accept method does not exist', () => {
      runMiddlewareForUrl(middleware, '/page.html', {accepts: null, input: AMP_DOC})
          .then((result) => {
            expect(result).toEqual('transformed: /page.html?amp=');
          });
    });

    it('skips transformation if request does not accept HTML', () => {
      runMiddlewareForUrl(middleware, '/page.html', {accepts: () => '', input: AMP_DOC})
          .then((result) => {
            expect(result).toEqual(AMP_DOC);
          });
    });
  });

  describe('handles transformation errors', () => {
    const transformer = {
      transformHtml: () => Promise.reject(new Error('error')),
    };

    const middleware = AmpOptimizerMiddleware.create({ampOptimizer: transformer});

    it('sends the original content when optimizer fails', () => {
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toEqual(AMP_DOC);
          });
    });
  });

  describe('options.runtimeVersion', () => {
    const transformer = {
      transformHtml: (body, options) => Promise.resolve(options.ampRuntimeVersion || ''),
    };

    it('default runtimeVersion is null', () => {
      const middleware = AmpOptimizerMiddleware.create({ampOptimizer: transformer});
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toBe('');
          });
    });

    it('uses runtimeVersion when set', () => {
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

    it('uses null if runtimeVersion fails', () => {
      const runtimeVersion = (() => Promise.reject(new Error('error')));
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
  describe('options.versionedRuntime', () => {
    const transformer = {
      transformHtml: (body, options) => Promise.resolve(options.ampRuntimeVersion || ''),
    };

    it('default versionedRuntime is false', () => {
      const middleware = AmpOptimizerMiddleware.create({ampOptimizer: transformer});
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).toBe('');
          });
    });

    it('uses versioned runtime when set', () => {
      const middleware = AmpOptimizerMiddleware.create({
        ampOptimizer: transformer,
        versionedRuntime: true,
      });
      runMiddlewareForUrl(middleware, '/page.html')
          .then((result) => {
            expect(result).not.toBe('');
          });
    });
  });
  describe('options.ampOnly', () => {
    const transformer = {
      transformHtml: () => Promise.resolve('transformed'),
    };

    describe('default is true', () => {
      it('transform if amp', () => {
        const middleware = AmpOptimizerMiddleware.create({
          ampOptimizer: transformer,
        });
        runMiddlewareForUrl(middleware, '/page.html', {input: '<html amp>'})
            .then((result) => {
              expect(result).toBe('transformed');
            });
      });
      it('does not transform if no amp', () => {
        const middleware = AmpOptimizerMiddleware.create({
          ampOptimizer: transformer,
        });
        runMiddlewareForUrl(middleware, '/page.html', {input: '<html>'})
            .then((result) => {
              expect(result).toBe('<html>');
            });
      });
    });

    it('false always transforms', () => {
      const middleware = AmpOptimizerMiddleware.create({
        ampOptimizer: transformer,
        ampOnly: false,
      });
      runMiddlewareForUrl(middleware, '/page.html', {input: '<html>'})
          .then((result) => {
            expect(result).toBe('transformed');
          });
    });
  });
});
