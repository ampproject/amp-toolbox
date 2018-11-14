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

let request; let response; let cors; let options;

describe('AMP Cors', () => {
  beforeEach(() => {
    request = {
      query: {},
      headers: {
        host: 'ampbyexample.com',
      },
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
    cors = ampCors(options);
  });
  describe('ignores requests', () => {
    it('without __amp_source_origin', (done) => {
      cors(request, response, () => {
        expect(response.headers).toEqual({});
        done();
      });
    });
    it('with __amp_source_origin but without Origin or AMP-SAME-ORIGIN', (done) => {
      request.query.__amp_source_origin = 'https://ampbyexample.com';
      cors(request, response, () => {
        expect(response.headers).toEqual({});
        done();
      });
    });
  });
  describe('cors headers are set for', () => {
    it('same origin requests', (done) => {
      request.headers['AMP-Same-Origin'] = 'true';
      request.query.__amp_source_origin = 'https://ampbyexample.com';
      cors(request, response, () => {
        expect(response.headers).toEqual({
          'Access-Control-Allow-Origin': 'https://ampbyexample.com',
          'Access-Control-Expose-Headers': ['AMP-Access-Control-Allow-Source-Origin'],
          'AMP-Access-Control-Allow-Source-Origin': 'https://ampbyexample.com',
        });
        done();
      });
    });
    it('foreign origins', (done) => {
      request.headers['Origin'] = 'https://ampbyexample-com.cdn.ampproject.org';
      request.query.__amp_source_origin = 'https://ampbyexample.com';
      cors(request, response, () => {
        expect(response.headers).toEqual({
          'Access-Control-Allow-Origin': 'https://ampbyexample-com.cdn.ampproject.org',
          'Access-Control-Expose-Headers': ['AMP-Access-Control-Allow-Source-Origin'],
          'AMP-Access-Control-Allow-Source-Origin': 'https://ampbyexample.com',
        });
        done();
      });
    });
  });
  describe('options', () => {
    describe('sourceOriginPattern', () => {
      let next;
      beforeEach(() => {
        options = {};
        options.sourceOriginPattern = /https:\/\/ampbyexample\.com$/;
        next = jasmine.createSpy('next');
      });
      describe('matches sourceOrigin', () => {
        beforeEach(() => {
          request.query.__amp_source_origin = 'https://ampbyexample.com';
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
          request.query.__amp_source_origin = 'https://example.com';
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
  });
});
