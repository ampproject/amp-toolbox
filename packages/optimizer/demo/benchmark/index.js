const Benchmark = require('benchmark');
const AmpOptimizer = require('../../');

const suite = new Benchmark.Suite();
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const testInput = await fs.readFile(path.join(__dirname, 'samples/amp.dev.html'), 'utf-8');

  console.log('Transformer Execution times:\n');

  console.log('\nUncached execution time\n');

  console.time('runtime');
  let runtimeOptimizer = AmpOptimizer.runtime({
    cache: false,
  });
  await runtimeOptimizer.transformHtml(testInput);
  console.timeEnd('runtime');
  console.time('buildtime');
  let buildtimeOptimizer = AmpOptimizer.buildtime({
    cache: false,
  });
  await buildtimeOptimizer.transformHtml(testInput);
  console.timeEnd('buildtime');

  // warm up caches
  runtimeOptimizer = AmpOptimizer.runtime({
    cache: true,
  });
  await runtimeOptimizer.transformHtml(testInput);
  buildtimeOptimizer = AmpOptimizer.buildtime({
    cache: true,
  });
  await buildtimeOptimizer.transformHtml(testInput);

  console.log('\nProfiling buildtime Optimizer\n');

  console.time('buildtime');
  const profiingBuildTimeOptimizer = AmpOptimizer.buildtime({profile: true});
  await profiingBuildTimeOptimizer.transformHtml(testInput);
  console.log('\n');
  console.timeEnd('buildtime');

  console.log('\nProfiling runtime Optimizer\n');

  console.time('runtime');
  const profilingRuntimeOptimizer = AmpOptimizer.runtime({profile: true});
  await profilingRuntimeOptimizer.transformHtml(testInput);
  console.log('\n');
  console.timeEnd('runtime');

  console.log('\n\nComparing runtime vs buildtime Optimizer\n');

  suite
    .add('runtime', {
      defer: true,
      fn: async (deferred) => {
        const result = await runtimeOptimizer.transformHtml(testInput);
        deferred.resolve(result);
      },
    })
    .add('buildtime', {
      defer: true,
      fn: async (deferred) => {
        const result = await buildtimeOptimizer.transformHtml(testInput);
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
