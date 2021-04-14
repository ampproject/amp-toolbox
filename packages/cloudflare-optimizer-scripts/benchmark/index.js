const PerfLeaderboard = require('performance-leaderboard');
const {printTable} = require('console-table-printer');

let urls = {
  'https://cf-optimizer-demo.web.app/the_scenic/templates/template_1_article.amp.html':
    'Unoptimized',
  'https://optimizer-demo.ampdev.workers.dev/the_scenic/templates/template_1_article.amp.html':
    'Optimized',
  'https://optimizer-demo-beta.ampdev.workers.dev/the_scenic/templates/template_1_article.amp.html':
    'Optimized w/ WebCache',
};
const runs = 30;

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
