import http from 'http';
import url from 'url'
import AmpOptimizer from '@ampproject/toolbox-optimizer';
const ampOptimizer = AmpOptimizer.create(getStaticOptions());

const port = 3000;

async function parseRequest(req) {
  return new Promise((resolve, reject) => {
    let data = [];

    req.on('data', (chunk) => {
      data.push(chunk);
    });
    req.on('error', (err) => reject(err));
    req.on('end', () =>
      resolve({
        body: data.Body.toString(),
        query: url.parse(req.url,true).query,
      })
    );
  });
}

const server = http.createServer(async (req, res) => {
  const {body} = await parseRequest(req);
  if (!body) {
    res.writeHead(400);
    res.end('Error: please provide html in the body of your post request.');
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
      res.end(optimizedHtml);
      res.send('500: Internal Service Error.');
    });
});

server.listen(port);
console.log(`AMP Optimizer listening at http://localhost:${port}`);

function snakeToCamel(str) {
  return str.toLowerCase().replace(/_[a-z]/g, (letter) => `_${letter.toUpperCase()}`);
}

function getStaticOptions() {
  const optionEntries = Object.keys(process.env)
    .filter((envVar) => envVar.startsWith('AMP_OPTIMIZER_'))
    .map((envVar) => {
      const optimizerFlag = snakeToCamel(envVar.substring('AMP_OPTIMIZER'.length));
      return [optimizerFlag, process.env[envVar]];
    });
  return Object.fromEntries(optionEntries);
}

process.on('SIGINT', function () {
  process.exit();
});
