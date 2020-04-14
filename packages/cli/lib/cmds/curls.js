/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

'use strict';

const {createCacheUrl} = require('@ampproject/toolbox-cache-url');
const AmpCaches = require('@ampproject/toolbox-cache-list');

async function curls(args, logger) {
  const url = args._[1];
  if (!url) {
    throw new Error('Missing URL');
  }
  const cacheId = args.cache;
  const servingType = args.servingType;
  const caches = new AmpCaches(args.fetch || require('node-fetch'));
  if (!cacheId) {
    const allCaches = await caches.list();
    return Promise.all(allCaches.map((cache) => printCurl(cache, url, logger, servingType)));
  } else {
    const cache = await caches.get(cacheId);
    if (!cache) {
      throw new Error('Unknown cache: ' + cacheId);
    }
    return printCurl(cache, url, logger, servingType);
  }
}

async function printCurl(cache, url, logger, servingType = null) {
  const curl = await createCacheUrl(cache.cacheDomain, url, servingType);
  logger.info(curl);
}

module.exports = curls;
