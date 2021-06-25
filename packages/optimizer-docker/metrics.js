const http = require('http');
const url = require('url');

const client = require('prom-client');

const registry = new client.Registry();

// Enable the collection of default metrics
client.collectDefaultMetrics({register: registry});

const mTransformedDurationGauge = new client.Summary({
  name: 'transformer_duration_seconds',
  help: 'Duration of the transformer in seconds',
  percentiles: [0.5, 0.75, 0.9, 0.99],
  labelNames: ['checkpoint'],
  maxAgeSeconds: 120,
  ageBuckets: 5,
});

registry.registerMetric(mTransformedDurationGauge);

function profiler(label) {
  return mTransformedDurationGauge.startTimer({checkpoint: label});
}

const managementServer = http.createServer(async (req, res) => {
  if (req.method === 'GET' && url.parse(req.url).pathname === '/metrics') {
    // Return all metrics the Prometheus exposition format
    res.setHeader('Content-Type', registry.contentType);
    res.end(await registry.metrics());
    return;
  }
  res.writeHead(404, {'Content-Type': 'text/plain'});
  res.end('Not found');
});

module.exports = {profiler, managementServer};
