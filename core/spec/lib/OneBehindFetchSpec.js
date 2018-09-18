/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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
'mode strict';

const OneBehindFetch = require('../../lib/OneBehindFetch.js');

class RequestHandlerStub {
  constructor() {
    this.result = '';
    this.maxAge = 0;
  }
  get(_) {
    return Promise.resolve({
      headers: {
        'cache-control': 'max-age=' + this.maxAge,
      },
      data: this.result,
    });
  }
}

let requestHandler;
let fetch;

describe('OneBehindFetch', () => {
  describe('get', () => {
    beforeEach(() => {
      requestHandler = new RequestHandlerStub();
      fetch = new OneBehindFetch(requestHandler);
    });
    it('fetches new value', (done) => {
      const expectedResult = 'hello';
      requestHandler.result = expectedResult;
      fetch.get('https://example.com')
          .then((data) => {
            expect(data).toBe(expectedResult);
            done();
          });
    });
    it('uses a one behind caching model', (done) => {
      requestHandler.result = 'hello';
      requestHandler.maxAge = 0;
      fetch.get('https://example.com');
      requestHandler.result = 'world';
      fetch.get('https://example.com')
          .then((data) => {
            expect(data).toBe('hello');
          });
      fetch.get('https://example.com')
          .then((data) => {
            expect(data).toBe('world');
            done();
          });
    });
  });
});

