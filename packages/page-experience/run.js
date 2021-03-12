const fs = require('fs').promises;
const fontCheck = require('./font-check');

(async () => {
  const urls = (await fs.readFile('./test.txt', 'utf-8')).split('\n');
  for (const url of urls) {
    try {
      const result = await fontCheck(url);
      console.log(url, result);
    } catch (e) {
      console.error(e);
    }
  }
})();
