const http = require('http');
const url = require('url');
const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const ampOptimizer = AmpOptimizer.create(getStaticOptions());

process.on('SIGINT', function () {
  process.exit();
});

const server = http.createServer(async (req, res) => {
  const isRootRequest = url.parse(req.url).pathname === '/';
  const isPost = req.method === 'POST';
  if (!isRootRequest || !isPost) {
    res.writeHead(400);
    res.end("Error: Invalid request. This server only accepts POST requests made to '/'.");
    return;
  }

  const {body: originalHtml, query: opts} = await parseRequest(req);
  if (!originalHtml) {
    res.writeHead(400);
    res.end('Error: Invalid request. This server requires HTML in the request body.');
    return;
  }

  ampOptimizer
    .transformHtml(originalHtml, opts)
    .then((optimizedHtml) => {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(optimizedHtml);
    })
    .catch((err) => {
      console.error(err);

      res.writeHead(500, {'Content-Type': 'text/plain'});
      res.end('500: Internal Service Error.');
    });
});

const port = 3000;
server.listen(port);
console.log(`AMP Optimizer listening at http://localhost:${port}`);

/*
 * Get the static options to pass AMP Optimizer on initialization.
 * All received environment variables prefixed with `AMP_OPTIMIZER_`
 * are transformed and returned.
 */
function getStaticOptions() {
  const optionEntries = Object.keys(process.env)
    .filter((envVar) => envVar.startsWith('AMP_OPTIMIZER_'))
    .map((envVar) => {
      const optimizerFlag = snakeToCamel(envVar.substring('AMP_OPTIMIZER'.length));
      return [optimizerFlag, process.env[envVar]];
    });
  return Object.fromEntries(optionEntries);
}

/**
 * Convert snake case string to camel case.
 *
 * @example
 * in: PRELOAD_HERO_IMAGE
 * out: preloadHeroImage
 */
function snakeToCamel(str) {
  return str.toLowerCase().replace(/_[a-z]/g, (letter) => `${letter.slice(1).toUpperCase()}`);
}

/*
 * Parse an incoming request into a text body and query params.
 */
async function parseRequest(req) {
  return new Promise((resolve, reject) => {
    let data = [];

    req.on('data', (chunk) => {
      data.push(chunk);
    });
    req.on('error', (err) => reject(err));
    req.on('end', () =>
      resolve({
        body: data.join(''),
        query: url.parse(req.url, true).query,
      })
    );
  });
}
