const http = require('http');
const qs = require('querystring');
const {start, stop} = require('../index');
const {getStaticOptions} = require('../utils');

describe('Server integration tests', () => {
  beforeEach(() => start());
  afterEach(() => stop());

  const VALID_REQUEST = `<html></html>`;

  it('should reject non POST requests', () => {
    const req = request({method: 'GET', body: VALID_REQUEST});
    return expect(req).rejects.toMatchObject({
      statusCode: 400,
      body: expect.stringMatching(/This server only accepts POST requests/),
    });
  });

  it('should reject requests not to the root', () => {
    const req = request({path: '/api', body: VALID_REQUEST});
    return expect(req).rejects.toMatchObject({
      statusCode: 400,
      body: expect.stringMatching(/This server only accepts requests made to/),
    });
  });

  it('should reject requests without a body', () => {
    const req = request();
    return expect(req).rejects.toMatchObject({
      statusCode: 400,
      body: expect.stringMatching(/This server requires HTML in the request body/),
    });
  });

  it('should run the provided HTML through the optimizer', async () => {
    const {body} = await request({body: VALID_REQUEST, query: {canonical: 'http://example.com'}});
    expect(body).toMatch('<!doctype html>');
    expect(body).toMatch('<link data-auto rel="canonical" href="http://example.com">');
  });
});

describe('Configuration tests', () => {
  it('should ignore all env vars without AMP_OPTIMIZER prefix', () => {
    const options = getStaticOptions({TEST_VALUE: 'TEST_VALUE'});
    expect(options).toEqual({});
  });

  it('should camelCase and pass along intended configuration', () => {
    const options = getStaticOptions({
      AMP_OPTIMIZER_TEST_VALUE: 'TEST_VALUE',
    });
    expect(options).toEqual({testValue: 'TEST_VALUE'});
  });
});

async function request({path = '/', method = 'POST', body, query} = {}) {
  if (query) {
    path += `?${qs.stringify(query)}`;
  }
  return new Promise((resolve, reject) => {
    const options = {
      headers: {'Content-Type': 'text/html'},
      hostname: 'localhost',
      method,
      path,
      port: 3000,
    };
    const req = http.request(options, (res) => {
      let data = [];
      res.on('data', (chunk) => {
        data.push(chunk);
      });
      res.on('end', () => {
        const body = data.join('');
        if (res.statusCode >= 400) {
          reject({statusCode: res.statusCode, body});
        }
        resolve({statusCode: res.statusCode, body});
      });
      res.on('error', (err) => reject(err));
    });
    req.on('error', (err) => reject(err));
    req.end(body);
  });
}
