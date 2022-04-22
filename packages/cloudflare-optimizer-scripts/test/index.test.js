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

jest.mock('@ampproject/toolbox-optimizer', () => {
  const transformHtml = jest.fn();
  return {
    create: jest.fn(() => ({transformHtml})),
    transformHtmlSpy: transformHtml,
  };
});

const {beforeEach, expect, it, describe} = require('@jest/globals');
const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const {
  getOptimizer,
  handleEvent,
  validateConfiguration,
  resetOptimizerForTesting,
} = require('../src/index');
const {Request, Response, HTMLRewriter} = require('./builtins');

beforeEach(() => {
  global.fetch = jest.fn();
  resetOptimizerForTesting();
  AmpOptimizer.create.mockClear();
  AmpOptimizer.transformHtmlSpy.mockReset();
  AmpOptimizer.transformHtmlSpy.mockImplementation((input) => `transformed-${input}`);

  global.Request = Request;
  global.Response = Response;
  global.HTMLRewriter = HTMLRewriter;
});

describe('handleEvent', () => {
  const defaultConfig = {MODE: 'test'};

  async function getOutput(url, config = defaultConfig) {
    const event = {
      request: {url, method: 'GET'},
      passThroughOnException: jest.fn(),
      respondWith: jest.fn(),
    };
    // Important: handleEvent must call event.respondWith sync.
    handleEvent(event, config);
    const response = await event.respondWith.mock.calls[0][0];
    return response.text();
  }

  it('Should proxy through non GET requests', async () => {
    const input = `<html amp><body></body></html>`;
    const incomingResponse = getResponse(input);
    global.fetch.mockReturnValue(incomingResponse);

    const request = {url: 'http://text.com', method: 'POST'};
    const event = {request, passThroughOnException: jest.fn(), respondWith: jest.fn()};
    handleEvent(event, defaultConfig);
    expect(await event.respondWith.mock.calls[0][0]).toBe(incomingResponse);
  });

  it('Should proxy through optimizer failures', async () => {
    const input = `<html amp><body></body></html>`;
    const incomingResponse = getResponse(input);
    global.fetch.mockReturnValue(incomingResponse);
    AmpOptimizer.transformHtmlSpy.mockImplementation(() => Promise.reject('Fail.'));

    const output = await getOutput('http://text.com');
    expect(output).toBe(input);
  });

  it('Should ignore non HTML documents', async () => {
    const input = `<html amp><body></body></html>`;
    const incomingResponse = getResponse(input, {contentType: 'other'});
    global.fetch.mockReturnValue(incomingResponse);

    const output = await getOutput('http://text.com');
    expect(output).toBe(input);
  });

  it('Should ignore non AMPHTML documents', async () => {
    const input = `<html><body></body></html>`;
    global.fetch.mockReturnValue(getResponse(input));

    const output = await getOutput('http://test.com');
    expect(output).toBe(input);
  });

  it('Should transform AMP HTML documents', async () => {
    const input = `<html amp><body></body></html>`;
    global.fetch.mockReturnValue(getResponse(input));

    const output = await getOutput('http://test.com');
    expect(output).toBe(`transformed-${input}`);
  });

  it('should handle redirects opaquely', async () => {
    const mockedResponse = new Response('', {
      status: 302,
      statusText: '',
    });

    const event = {
      request: {method: 'GET', url: 'https://example.com/'},
      respondWith: jest.fn(),
      passThroughOnException: jest.fn(),
    };

    global.fetch.mockImplementation(() => Promise.resolve(mockedResponse));

    handleEvent(event, defaultConfig);
    expect(await event.respondWith.mock.calls[0][0]).toBe(mockedResponse);
    expect(event.respondWith).toHaveBeenCalledTimes(1);
  });

  it('Should passthrough request to origin in request interceptor mode', async () => {
    const input = `<html amp><body></body></html>`;
    global.fetch.mockReturnValue(getResponse(input));
    await getOutput('http://test.com');
    expect(global.fetch).toBeCalledWith(
      {url: 'http://test.com/', method: 'GET'},
      {redirect: 'manual'}
    );
  });

  it('Should modify request url for reverse-proxy', async () => {
    const config = {proxy: {worker: 'test.com', origin: 'test-origin.com'}};
    const input = `<html amp><body></body></html>`;
    global.fetch.mockReturnValue(getResponse(input));

    await getOutput('http://test.com', config);
    expect(global.fetch).toBeCalledWith(
      {url: 'http://test-origin.com/', method: 'GET'},
      {redirect: 'manual'}
    );
  });

  it('should call enable passThroughOnException', async () => {
    const request = {url: 'http://text.com'};
    const event = {request, passThroughOnException: jest.fn()};
    await handleEvent(event, defaultConfig);

    expect(event.passThroughOnException).toBeCalled();
  });
});

describe('validateConfig', () => {
  it('Should accept valid configurations', () => {
    validateConfiguration({});
    validateConfiguration({proxy: {worker: 'worker.dev', origin: 'example.com'}});
    validateConfiguration({enableCloudflareImageOptimization: true, enableKVCache: true});
  });

  it('Should throw if only one of the two proxy keys are present', () => {
    expect(() => validateConfiguration({proxy: {worker: ''}})).toThrow();
    expect(() => validateConfiguration({proxy: {origin: ''}})).toThrow();
  });

  it('Should throw if unknown keys are present', () => {
    const config = {hello: 'world'};
    expect(() => validateConfiguration(config)).toThrow();
  });
});

describe('getAmpOptimizer', () => {
  it('Should pass through options from configuration.', () => {
    getOptimizer({optimizer: {maxHeroImageCount: 42}});
    expect(AmpOptimizer.create).toBeCalledWith(
      expect.objectContaining({
        maxHeroImageCount: 42,
      })
    );
  });

  it('Should override specific settings', () => {
    getOptimizer({cache: true});
    expect(AmpOptimizer.create).toBeCalledWith(expect.objectContaining({cache: false}));
  });

  // See https://developers.cloudflare.com/images/url-format.
  it('Should rewrite images using cloudflare image resizing', () => {
    getOptimizer({enableCloudflareImageOptimization: false});
    expect(AmpOptimizer.create).toBeCalledWith(
      expect.objectContaining({imageOptimizer: undefined})
    );
    AmpOptimizer.create.mockClear();

    getOptimizer({enableCloudflareImageOptimization: true});
    expect(AmpOptimizer.create).toBeCalledWith(
      expect.objectContaining({imageOptimizer: expect.any(Function)})
    );
  });
});

function getResponse(html, {contentType} = {contentType: 'text/html'}) {
  return new Response(html, {
    headers: {get: () => contentType},
    status: 200,
    statusText: '200',
  });
}
