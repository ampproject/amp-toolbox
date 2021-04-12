const PerfLeaderboard = require('performance-leaderboard');
const {printTable} = require('console-table-printer');

let urls = {
  'https://cf-optimizer-demo.web.app/themes_1/templates/template_1_article.amp.html': 'Firebase',
  'https://optimizer-demo.ampdev.workers.dev/themes_1/templates/template_1_article.html': 'CF Proxy',
  'https://optimizer-demo.ampdev.workers.dev/themes_1/templates/template_1_article.amp.html': 'CF Optimized',
}
const runs = 1;

async function run() {
  const scores = await PerfLeaderboard(Object.keys(urls), runs);
  const table = scores.map((s) => ({
    'rank': s.ranks.performance,
    'runs': runs,
    'version': urls[s.url],
    'FCP (mean)': s.firstContentfulPaint,
    'LCP (mean)': s.largestContentfulPaint,
    'CLS (mean)': s.cumulativeLayoutShift,
  }));
  printTable(table);
}

run();
