/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
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
const {beforeEach, expect, it, describe} = require('@jest/globals');
const {DocTagger, LinkRewriter} = require('../src/rewriters');

describe('Rewriters', () => {
  describe('LinkRewriter', () => {
    let a;
    beforeEach(() => {
      a = {
        getAttribute: jest.fn((attr) => {
          if (attr === 'href') {
            return 'https://test-origin.com/subpage';
          }
          return null;
        }),
        setAttribute: jest.fn(),
      };
    });

    it('Should rewrite to localhost in MODE=dev', () => {
      const config = {
        proxy: {
          worker: 'test-worker.com',
          origin: 'test-origin.com',
        },
        MODE: 'dev',
      };
      new LinkRewriter(config).element(a);
      expect(a.setAttribute).toBeCalledWith('href', 'http://localhost:8787/subpage');
    });

    it('Should rewrite origin links to the worker url', () => {
      const config = {proxy: {worker: 'test-worker.com', origin: 'test-origin.com'}};
      new LinkRewriter(config).element(a);
      expect(a.setAttribute).toBeCalledWith('href', 'https://test-worker.com/subpage');
    });
  });

  describe('DocTagger', () => {
    it('Should add data-cfw as an attribute to nodes', () => {
      const element = {setAttribute: jest.fn()};
      new DocTagger().element(element);
      expect(element.setAttribute).toBeCalledWith('data-cfw', '');
    });
  });
});
