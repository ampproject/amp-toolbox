const http = require('http');
const url = require('url');
const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const {parseRequest, getStaticOptions} = require('./utils');

const ampOptimizer = AmpOptimizer.create(getStaticOptions());

process.on('SIGINT', function () {
  process.exit();
});

const server = http.createServer(async (req, res) => {
  const isRootRequest = url.parse(req.url).pathname === '/';
  const isPost = req.method === 'POST';
  if (!isPost) {
    res.writeHead(400);
    res.end('Error: Invalid request. This server only accepts POST requests.');
    return;
  }
  if (!isRootRequest) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end("Error: Invalid request. This server only accepts requests made to '/'.");
    return;
  }

  const {body: originalHtml, query: opts} = await parseRequest(req);
  if (!originalHtml) {
    res.writeHead(400, {'Content-Type': 'text/plain'});
    res.end('Error: Invalid request. This server requires HTML in the request body.');
    return;
  }

  try {
    const optimizedHtml = await ampOptimizer.transformHtml(originalHtml, opts);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(optimizedHtml);
  } catch (err) {
    console.error(err);
    res.writeHead(500, {'Content-Type': 'text/plain'});
    res.end('500: Internal Service Error.');
  }
});

const port = 3000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(port);
  console.log(`AMP Optimizer listening at http://localhost:${port}`);
} else {
  module.exports = {
    start: () => server.listen(port),
    stop: () => server.close(),
  };
}
