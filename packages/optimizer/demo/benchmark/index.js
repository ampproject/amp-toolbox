const Benchmark = require('benchmark');
const AmpOptimizer = require('../../');

const suite = new Benchmark.Suite();
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const testInput = await fs.readFile(path.join(__dirname, 'samples/amp.dev.html'), 'utf-8');

  console.log('Transformer Execution times:\n');
  const profilingOptimizer = AmpOptimizer.create({profile: true});
  await profilingOptimizer.transformHtml(testInput);

  console.log('\n\nFill vs Minimal mode\n');

  console.time('default');
  const defaultAmpOptimizer = AmpOptimizer.create({
    cache: false,
  });
  await defaultAmpOptimizer.transformHtml(testInput);
  console.timeEnd('default');
  console.time('minimal');
  const minimalAmpOptimizer = AmpOptimizer.create({
    cache: false,
    transformations: AmpOptimizer.TRANSFORMATIONS_MINIMAL,
  });
  await minimalAmpOptimizer.transformHtml(testInput);
  console.timeEnd('minimal');
  //
  suite
    .add('minimal', {
      defer: true,
      fn: async (deferred) => {
        const result = await minimalAmpOptimizer.transformHtml(testInput);
        deferred.resolve(result);
      },
    })
    .add('default', {
      defer: true,
      fn: async (deferred) => {
        const result = await defaultAmpOptimizer.transformHtml(testInput);
        deferred.resolve(result);
      },
    })
    .on('cycle', function (event) {
      console.log(String(event.target), `${event.target.stats.mean * 1000}ms`);
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    // run async
    .run({async: true});
})();
