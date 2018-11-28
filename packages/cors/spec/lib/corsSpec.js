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

const ampCors = require('../../lib/cors.js');

let request;
let response;
let cors;
let options = {verbose: true};

describe('AMP Cors', () => {
  beforeEach(() => {
    request = {
      headers: {
        host: 'ampbyexample.com',
      },
      method: 'GET',
      url: '/sample',
      protocol: 'https',
    };
    response = {
      status_: 200,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      status(status) {
        this.status_ = status;
        return this;
      },
      end() {
        this.end_ = true;
      },
    };
    caches = {
      list: () => Promise.resolve([{cacheDomain: 'cdn.ampproject.org'}]),
    };
    cors = ampCors(options, caches);
  });
  describe('ignores requests', () => {
    it('without __amp_source_origin', (done) => {
      cors(request, response, () => {
        expect(response.headers).toEqual({});
        done();
      });
    });
  });
  describe('sends 400', () => {
    it('with __amp_source_origin but without Origin or AMP-SAME-ORIGIN', (done) => {
      request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
      cors(request, response, () => {}).then(() => {
        expect(response.status_).toEqual(400);
        done();
      });
    });
  });
  describe('cors headers are set for', () => {
    it('same origin requests', (done) => {
      request.headers['AMP-Same-Origin'] = 'true';
      request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
      cors(request, response, () => {
        expect(response.headers['Access-Control-Allow-Origin']).toBe('https://ampbyexample.com');
        expect(response.headers['Access-Control-Expose-Headers'])
            .toContain('AMP-Access-Control-Allow-Source-Origin');
        expect(response.headers['AMP-Access-Control-Allow-Source-Origin']).toBe('https://ampbyexample.com');
        done();
      });
    });
    it('foreign origins', (done) => {
      request.headers['Origin'] = 'https://ampbyexample-com.cdn.ampproject.org';
      request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
      cors(request, response, () => {
        expect(response.headers['Access-Control-Allow-Origin']).toBe('https://ampbyexample-com.cdn.ampproject.org');
        expect(response.headers['Access-Control-Expose-Headers'])
            .toContain('AMP-Access-Control-Allow-Source-Origin');
        expect(response.headers['AMP-Access-Control-Allow-Source-Origin']).toBe('https://ampbyexample.com');
      }).then(() => done());
    });
  });
  describe('options', () => {
    describe('verifyOrigin', () => {
      describe('true', () => {
        beforeEach(() => {
          options = {};
          options.verifyOrigin = true;
        });
        it('allows official origins', (done) => {
          request.headers['Origin'] = 'https://ampbyexample-com.cdn.ampproject.org';
          request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
          cors(request, response, () => {
            expect(response.status_).toEqual(200);
            done();
          });
        });
        it('allows bing', (done) => {
          request.headers['Origin'] = 'https://ampbyexample-com.bing-amp.com';
          request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
          cors(request, response, () => {
            expect(response.status_).toEqual(200);
            done();
          });
        });
        it('blocks all other origins', (done) => {
          request.headers['Origin'] = 'https://ampbyexample-com.cdn.invalid.org';
          request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
          cors(request, response, () => {}).then(() => {
            expect(response.status_).toEqual(403);
            done();
          });
        });
      });
      describe('false', () => {
        beforeEach(() => {
          options = {};
          options.verifyOrigin = false;
          cors = ampCors(options, caches);
        });
        it('allows all origins', (done) => {
          request.headers['Origin'] = 'https://example.com';
          request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
          cors(request, response, () => {
            expect(response.status_).toEqual(200);
            done();
          });
        });
      });
    });
    describe('allowCredentials', () => {
      beforeEach(() => {
        request.headers['Origin'] = 'https://example.com';
        request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
      });
      it('is true [default]', (done) => {
        cors(request, response, () => {
          expect(response.headers['Access-Control-Allow-Credentials']).toBe('true');
          done();
        });
      });
      it('does not send header if false', (done) => {
        options = {};
        options.allowCredentials = false;
        cors = ampCors(options, caches);
        cors(request, response, () => {
          expect(response.headers['Access-Control-Allow-Credentials']).toBe(undefined);
          done();
        });
      });
    });
    describe('enableAmpRedirectTo', () => {
      beforeEach(() => {
        request.headers['Origin'] = 'https://example.com';
        request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
      });
      it('is true [default]', (done) => {
        cors(request, response, () => {
          expect(response.headers['Access-Control-Expose-Headers'])
              .toEqual(['AMP-Access-Control-Allow-Source-Origin', 'AMP-Redirect-To']);
          done();
        });
      });
      it('does not send header if false', (done) => {
        options = {};
        options.enableAmpRedirectTo = false;
        cors = ampCors(options, caches);
        cors(request, response, () => {
          expect(response.headers['Access-Control-Expose-Headers'])
              .toEqual(['AMP-Access-Control-Allow-Source-Origin']);
          done();
        });
      });
    });
  });
});
describe('sourceOriginPattern', () => {
  let next;
  beforeEach(() => {
    options = {};
    options.sourceOriginPattern = /https:\/\/ampbyexample\.com$/;
    cors = ampCors(options, caches);
    next = jasmine.createSpy('next');
    request.headers['AMP-Same-Origin'] = 'true';
  });
  describe('matches sourceOrigin', () => {
    beforeEach(() => {
      request.url = '/sample?__amp_source_origin=https://ampbyexample.com';
    });
    it('does not change the status code', (done) => {
      cors(request, response, () =>{
        expect(response.status_).toEqual(200);
        done();
      });
    });
  });
  describe('does not match sourceOrigin', () => {
    beforeEach(() => {
      request.url = '/sample?__amp_source_origin=https://example.com';
      cors(request, response, next);
    });
    it('returns status 403', () => {
      expect(response.status_).toEqual(403);
    });
    it('ends the response', () => {
      expect(response.end_).toEqual(true);
    });
    it('ends middleware chain', () => {
      expect(next).not.toHaveBeenCalled();
    });
  });
});
