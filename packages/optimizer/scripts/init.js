#!/usr/bin/env node
const AmpOptimizer = require('../');
const ampOptimizer = AmpOptimizer.create();

async function warmupCaches() {
  // run a dummy transformation to pre-fill the caches
  ampOptimizer.transformHtml('<h1>hello world</h1>', {
    canonical: '.',
    verbose: true,
  });
}

warmupCaches();
