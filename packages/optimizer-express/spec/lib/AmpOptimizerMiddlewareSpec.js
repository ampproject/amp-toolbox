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
const TRANSFORMED_AMP_DOC = 'transformed: <html amp>original</html>';

class TestTransformer {
  transformHtml(body) {
    return Promise.resolve('transformed: ' + body);
  }
}

function runMiddlewareForUrl(middleware, url, options = {accepts: () => 'html', input: AMP_DOC}) {
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
    const middleware = AmpOptimizerMiddleware.create(new TestTransformer());

    const runStaticTest = (url, expected) => {
      runMiddlewareForUrl(middleware, url).then((result) => {
        expect(result).toEqual(expected);
      });
    };

    ['/image.jpg', '/image.svg', '/script.js', '/style.css'].forEach((url) => {
      it(`Does not transform ${url}`, () => runStaticTest(url, AMP_DOC));
    });

    ['/', '/path.com/', '', 'path.jpg/'].forEach((url) => {
      it(`Transforms path url ${url}`, () => runStaticTest(url, TRANSFORMED_AMP_DOC));
    });

    it('applies transformation if req.accept method does not exist', () => {
      runMiddlewareForUrl(middleware, '/page.html', {accepts: null, input: AMP_DOC}).then(
        (result) => {
          expect(result).toEqual(TRANSFORMED_AMP_DOC);
        }
      );
    });

    it('skips transformation if request does not accept HTML', () => {
      runMiddlewareForUrl(middleware, '/page.html', {accepts: () => '', input: AMP_DOC}).then(
        (result) => {
          expect(result).toEqual(AMP_DOC);
        }
      );
    });
  });

  describe('handles transformation errors', () => {
    const transformer = {
      transformHtml: () => Promise.reject(new Error('error')),
    };

    const middleware = AmpOptimizerMiddleware.create({ampOptimizer: transformer});

    it('sends the original content when optimizer fails', () => {
      runMiddlewareForUrl(middleware, '/page.html').then((result) => {
        expect(result).toEqual(AMP_DOC);
      });
    });
  });
});
