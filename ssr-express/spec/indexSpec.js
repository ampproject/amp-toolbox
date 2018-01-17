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
const {URL} = require('whatwg-url');
const createAmpSsrMiddleware = require('../index.js');

class TestTransformer {
  transformHtml() {
    return 'transformed';
  }
}

function runMiddlewareForUrl(middleware, url) {
  const mockResponse = new MockExpressResponse();
  const next = () => mockResponse.send('original');
  const mockRequest = new MockExpressRequest({
    url: url
  });
  middleware(mockRequest, mockResponse, next);

  return mockResponse._getString();
}

describe('Express Middleware', () => {
  describe('Default configuration', () => {
    const middleware = createAmpSsrMiddleware(new TestTransformer());

    it('Transforms URLs', () => {
      const result = runMiddlewareForUrl(middleware, '/stuff?q=thing');
      expect(result).toEqual('transformed');
    });

    it('Skips Urls starting with "/amp/"', () => {
      const result = runMiddlewareForUrl(middleware, '/amp/stuff?q=thing');
      expect(result).toEqual('original');
    });
  });

  describe('Custom Configuration', () => {
    const skipTransform = url => {
      // http://example.com is used as the second parameter,
      // as the URL constructor requires a valid domain.
      const parsedUrl = new URL(url, 'https://example.com');
      return parsedUrl.searchParams.has('amp');
    };
    const getAmpUrl = url => {
      // http://example.com is used as the second parameter,
      // as the URL constructor requires a valid domain.
      const parsedUrl = new URL(url, 'https://example.com');
      parsedUrl.searchParams.set('amp', '');
      return parsedUrl.pathname + parsedUrl.search;
    };
    const middleware = createAmpSsrMiddleware(new TestTransformer(), {
      skipTransform: skipTransform,
      getAmpUrl: getAmpUrl
    });

    it('Transforms URLs', () => {
      const result = runMiddlewareForUrl(middleware, '/stuff');
      expect(result).toEqual('transformed');
    });

    it('Skips Urls', () => {
      const result = runMiddlewareForUrl(middleware, '/stuff?amp');
      expect(result).toEqual('original');
    });
  });
});
