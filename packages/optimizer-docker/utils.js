const {profiler} = require('./metrics');
const url = require('url');

const defaultConfiguration = {profile: true};

function objectFromEntries(arr) {
  return Object.assign({}, ...Array.from(arr, ([k, v]) => ({[k]: v})));
}

function maybeParseBool(value) {
  return value === 'true' ? true : value === 'false' ? false : value;
}

function configureProfiling(configuration) {
  if (configuration.profile) {
    // enable the prometheus profiling
    return {...configuration, profiler};
  }
  return configuration;
}

function getOptionsFromEnv(env) {
  const entries = Object.keys(env)
    .filter((envVar) => envVar.startsWith('AMP_OPTIMIZER_'))
    .map((envVar) => {
      const optimizerFlag = snakeToCamel(envVar.substring('AMP_OPTIMIZER_'.length));
      return [optimizerFlag, maybeParseBool(env[envVar])];
    });
  return objectFromEntries(entries);
}

/*
 * Get the static options to pass AMP Optimizer on initialization.
 * All received environment variables prefixed with `AMP_OPTIMIZER_`
 * are transformed and returned.
 */
function getStaticOptions(env = process.env) {
  return configureProfiling(Object.assign(defaultConfiguration, getOptionsFromEnv(env)));
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
