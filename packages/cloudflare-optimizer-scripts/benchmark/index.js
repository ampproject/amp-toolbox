const PerfLeaderboard = require('performance-leaderboard');
const {printTable} = require('console-table-printer');

let urls = {
  'https://cf-optimizer-demo.web.app/ecommerce/templates/landing.amp.html': 'Firebase',
  'https://optimizer-demo.ampdev.workers.dev/ecommerce/templates/landing.amp.html': 'CF Optimized',
};
const runs = 10;

async function run() {
  const scores = await PerfLeaderboard(Object.keys(urls), runs);
  const table = scores
    .map((s) => ({
      'rank': s.ranks.performance,
      'runs': runs,
      'version': urls[s.url],
      'FCP (mean)': s.firstContentfulPaint,
      'LCP (mean)': s.largestContentfulPaint,
      'CLS (mean)': s.cumulativeLayoutShift,
    }))
    .sort((a, b) => a.rank - b.rank);
  printTable(table);
}

run();
