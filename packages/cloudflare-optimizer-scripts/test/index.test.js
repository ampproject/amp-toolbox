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
  handleRequest,
  validateConfiguration,
  resetOptimizerForTesting,
} = require('../src/index');
const {Response, HTMLRewriter} = require('./builtins');

beforeEach(() => {
  global.fetch = jest.fn();
  resetOptimizerForTesting();
  AmpOptimizer.create.mockClear();
  AmpOptimizer.transformHtmlSpy.mockReset();
  AmpOptimizer.transformHtmlSpy.mockImplementation((input) => `transformed-${input}`);

  global.Response = Response;
  global.HTMLRewriter = HTMLRewriter;
});

describe('handleRequest', () => {
  const defaultConfig = {domain: 'example.com', MODE: 'test'};

  function getOutput(url, config = defaultConfig) {
    const event = {
      request: {url, method: 'GET'},
      passThroughOnException: jest.fn(),
    };
    return handleRequest(event, config).then((r) => r.text());
  }

  it('Should proxy through non GET requests', async () => {
    const input = `<html amp><body></body></html>`;
    const incomingResponse = getResponse(input);
    global.fetch.mockReturnValue(incomingResponse);

    const request = {url: 'http://text.com', method: 'POST'};
    const event = {request, passThroughOnException: jest.fn()};
    const output = await handleRequest(event, defaultConfig);
    expect(output).toBe(incomingResponse);
  });

  it('Should proxy through optimizer failures', async () => {
    const input = `<html amp><body></body></html>`;
    const incomingResponse = getResponse(input);
    global.fetch.mockReturnValue(incomingResponse);
    AmpOptimizer.transformHtmlSpy.mockReturnValue(Promise.reject('Fail.'));

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

  it('Should passthrough request to origin in request interceptor mode', async () => {
    const input = `<html amp><body></body></html>`;
    global.fetch.mockReturnValue(getResponse(input));
    await getOutput('http://test.com');
    expect(global.fetch).toBeCalledWith('http://test.com/', expect.anything());
  });

  it('Should modify request url for reverse-proxy', async () => {
    const config = {from: 'test.com', to: 'test-origin.com'};
    const input = `<html amp><body></body></html>`;
    global.fetch.mockReturnValue(getResponse(input));

    await getOutput('http://test.com', config);
    expect(global.fetch).toBeCalledWith('http://test-origin.com/', expect.anything());
  });

  it('should call enable passThroughOnException', async () => {
    const request = {url: 'http://text.com'};
    const event = {request, passThroughOnException: jest.fn()};
    await handleRequest(event, defaultConfig);

    expect(event.passThroughOnException).toBeCalled();
  });
});

describe('validateConfig', () => {
  it('Should throw unless {to,from} or {domain} are present', () => {
    expect(() => validateConfiguration({})).toThrow();
  });

  it('Should throw if both {to,from} and {domain} are present', () => {
    const config = {to: 'test', from: 'test', domain: 'test'};
    expect(() => validateConfiguration(config)).toThrow();
  });

  it('Should throw if unknown keys are present', () => {
    const config = {domain: 'example.com', hello: 'world'};
    expect(() => validateConfiguration(config)).toThrow();
  });

  it('Should accept valid configurations', () => {
    validateConfiguration({domain: 'example.com'});
    validateConfiguration({from: 'example-from.com', to: 'example-to.com'});
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
