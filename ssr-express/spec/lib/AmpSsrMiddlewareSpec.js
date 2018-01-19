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
const AmpSsrMiddleware = require('../../lib/AmpSsrMiddleware');

class TestTransformer {
  async transformHtml(body, options) {
    return 'transformed: ' + options.ampUrl;
  }
}

function runMiddlewareForUrl(middleware, url) {
  return new Promise(resolve => {
    const mockResponse = new MockExpressResponse();
    const next = () => mockResponse.send('original');
    const mockRequest = new MockExpressRequest({
      url: url
    });

    const end = mockResponse.end;
    mockResponse.end = chunks => {
      mockResponse.end = end;
      mockResponse.end(chunks);
      resolve(mockResponse._getString());
    };
    middleware(mockRequest, mockResponse, next);
  });
}

describe('Express Middleware', () => {
  describe('Default configuration', () => {
    const middleware = AmpSsrMiddleware.create({ampSsr: new TestTransformer()});

    it('Transforms URLs', async () => {
      const result = await runMiddlewareForUrl(middleware, '/stuff?q=thing');
      expect(result).toEqual('transformed: /stuff?q=thing&amp=');
    });

    it('Skips Urls starting with "/amp/"', async () => {
      const result = await runMiddlewareForUrl(middleware, '/amp/stuff?q=thing&amp');
      expect(result).toEqual('original');
    });
  });
});
