/**
 * Copyright 2021 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*global fetch,KV,HTMLRewriter,Response*/

const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const {DocTagger, LinkRewriter} = require('./rewriters');

// For origins that do not specify cache-control headers,
// we use a default TTL of 15 minutes.
const DEFAULT_TTL = 60 * 15;

/**
 * Configuration typedef.
 * @typedef {{
 *  proxy: { origin: string, worker: string},
 *  optimizer: Object,
 *  enableCloudflareImageOptimization: boolean,
 *  enableKVCache: boolean,
 *  MODE: string,
 * }} ConfigDef
 */

/**
 * @param {!FetchEvent} event
 * @param {!ConfigDef} config
 * @return {!Request}
 */
async function handleEvent(event, config) {
  event.passThroughOnException();

  try {
    const response = handleRequest(event, config);
    event.respondWith(response);
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(e);
    }
    // Passthrough cannot work in rev proxy mode, so force a response.
    if (isReverseProxy(config)) {
      event.respondWith(new Response(`Error thrown: ${e.message}`, {status: 500}));
    }
  }
}

/**
 * @param {!FetchEvent} event
 * @param {!ConfigDef} config
 * @return {!Request}
 */
async function handleRequest(event, config) {
  validateConfiguration(config);

  const request = event.request;
  const url = new URL(request.url);
  if (isReverseProxy(config)) {
    url.hostname = config.proxy.origin;
  }

  // Immediately return if not GET.
  if (request.method !== 'GET') {
    request.url = url;
    return fetch(request);
  }

  // First layer caching, local to the datacenter
  {
    const cached = await caches.default.match(request);
    if (cached) {
      return cached;
    }
  }

  // Start the fetch before even checking KV Cache.
  // This way if it isn't in KV (i.e. not an HTML file) we've greedily started the fetch and didn't have to wait.
  if (config.enableKVCache) {
    const cached = await KV.get(request.url);
    if (cached) {
      // TODO: can we do something faster than JSON.parse?
      const {status, statusText, headers, text} = JSON.parse(cached);
      const response = new Response(text, {status, statusText, headers});
      event.waitUntil(storeResponseCache(request, response.clone()));
      return response;
    }
  }

  const response = await fetch(request, {cf: {minify: {html: true}}});
  const clonedResponse = response.clone();
  const {headers, status, statusText} = response;

  // Note: it turns out that content-type lies ~25% of the time.
  // See: https://blog.cloudflare.com/html-parsing-1/
  if (!headers.get('content-type').includes('text/html')) {
    return clonedResponse;
  }

  const responseText = await response.text();
  if (!isAmp(responseText)) {
    // Note: we do not rewrite URLs for non-AMP. Unclear if we should.
    return clonedResponse;
  }

  try {
    const optimizer = getOptimizer(config);
    const transformed = await optimizer.transformHtml(responseText);
    let response = new Response(transformed, {headers, statusText, status});
    const rewritten = addTag(maybeRewriteLinks(response, config));

    event.waitUntil(
      Promise.all([
        storeResponseCache(request, rewritten.clone()),
        config.enableKVCache ? storeResponseKV(request.url, rewritten.clone()) : Promise.resolve(),
      ])
    );
    return rewritten;
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error(`Failed to optimize: ${url.toString()}, with Error; ${err}`);
    }
    return clonedResponse;
  }
}

/**
 * @param {string} key
 * @param {!Response} response
 * @returns {!Promise}
 */
async function storeResponseKV(key, response) {
  // Wait a macrotask so that all of this logic occurs after
  // we've already started streaming the response.
  await new Promise((r) => setTimeout(r, 0));

  const {headers, status, statusText} = response;
  const text = await response.text();

  const maxAge = parseCacheControl(headers.get('cache-control')).maxAge;
  const expirationTtl = Number.isFinite(maxAge) ? maxAge : DEFAULT_TTL;
  return KV.put(
    key,
    JSON.stringify({
      text,
      headers: Array.from(headers.entries()),
      statusText,
      status,
    }),
    {
      expirationTtl,
    }
  );
}

/**
 * @param {!Request} request
 * @param {!Response} response
 * @returns {!Promise}
 */
async function storeResponseCache(request, response) {
  return caches.default.put(request, response);
}

/**
 * @param {!Response} response
 * @param {!ConfigDef} config
 * @returns {!Response}
 */
function maybeRewriteLinks(response, config) {
  if (!isReverseProxy(config)) {
    return response;
  }
  const linkRewriter = new HTMLRewriter().on('a', new LinkRewriter(config));
  return linkRewriter.transform(response);
}

/**
 * Adds `data-cfw` to the html node to mark it as optimized by this package.
 * @param {!Response} response
 * @returns {!Response}
 */
function addTag(response) {
  const rewriter = new HTMLRewriter().on('html', new DocTagger());
  return rewriter.transform(response);
}

/**
 * @param {string} html
 * @returns {boolean}
 */
function isAmp(html) {
  return /<html\s[^>]*(⚡|amp)[^>]*>/.test(html);
}

/**
 * @param {!ConfigDef} config
 * @returns {boolean}
 */
function isReverseProxy(config) {
  return !!config.proxy;
}

/**
 * @param {string} str
 * @return {maxAge: number | undefined}
 */
function parseCacheControl(str) {
  const maxAge = str.match(/max-age=(\d+)/)[1];
  return {maxAge};
}

/** @param {!ConfigDef} config */
function validateConfiguration(config) {
  const allowed = new Set([
    'from',
    'proxy',
    'optimizer',
    'enableCloudflareImageOptimization',
    'MODE',
    'enableKVCache',
  ]);
  Object.keys(config).forEach((key) => {
    if (!allowed.has(key)) {
      throw new Error(`Unknown key "${key}" found in configuration.`);
    }
  });

  if (isReverseProxy(config)) {
    if (!config.proxy.origin || !config.proxy.worker) {
      throw new Error(
        `If using amp-cloudflare-worker as a reverse proxy, you must provide both a "origin" and "worker" domains in config.json.`
      );
    }
  }
}

let ampOptimizer = null;
/**
 * Returns an AmpOptimizer for the given configuraion.
 *
 * 1. cache set to false, s.t. it doesn't try to write to fs.
 * 2. minify:false is necessary to speed up the AmpOptimizer. terser also cannot be used since dynamic eval() is part of terser and banned by CloudflareWorkers.
 *    see the webpack.config.js for how we disable the terser module.
 * 3. fetch is set to Cloudflare Worker provided fetch, with high caching to amortize startup time for each AmpOptimizer instance.
 * @param {!ConfigDef} config
 * @returns {!AmpOptimizer}
 */
function getOptimizer(config) {
  if (ampOptimizer) {
    return ampOptimizer;
  }
  const imageOptimizer = (src, width) => `/cdn-cgi/image/width=${width},f=auto/${src}`;
  return AmpOptimizer.create({
    ...(config.optimizer || {}),
    minify: false,
    cache: false,
    fetch: (url, init) =>
      fetch(url, {
        ...init,
        cf: {
          cacheTtl: 6 * 60 * 60, // 6 hours. Only needed for AmpOptimizer init.
          cacheEverything: true,
          minify: {html: true},
        },
      }),
    transformations: AmpOptimizer.TRANSFORMATIONS_MINIMAL,
    imageOptimizer: config.enableCloudflareImageOptimization ? imageOptimizer : undefined,
  });
}

function resetOptimizerForTesting() {
  ampOptimizer = null;
}

module.exports = {
  getOptimizer,
  handleEvent,
  validateConfiguration,
  resetOptimizerForTesting,
  validateConfiguration,
};
