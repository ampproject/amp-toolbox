const url = require('url');

/*
 * Get the static options to pass AMP Optimizer on initialization.
 * All received environment variables prefixed with `AMP_OPTIMIZER_`
 * are transformed and returned.
 */
function getStaticOptions(env = process.env) {
  const optionEntries = Object.keys(env)
    .filter((envVar) => envVar.startsWith('AMP_OPTIMIZER_'))
    .map((envVar) => {
      const optimizerFlag = snakeToCamel(envVar.substring('AMP_OPTIMIZER_'.length));
      return [optimizerFlag, env[envVar]];
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

module.exports = {getStaticOptions, parseRequest};
