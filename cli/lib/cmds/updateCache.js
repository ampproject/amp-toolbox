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

const fetch = require('node-fetch');
const fs = require('fs');
const UpdateCacheUrlProvider = require('amp-toolbox-update-cache');

async function updateCaches(privateKey, url, logger) {
  logger.log(`Invalidating AMP Caches for ${url}`);
  try {
    const updateCacheUrlProvider = UpdateCacheUrlProvider.create(privateKey);
    const cacheUpdateUrls = await updateCacheUrlProvider.calculateFromOriginUrl(url);
    cacheUpdateUrls.forEach(updateCache, logger);
    return 0;
  } catch (e) {
    logger.error(`Error generating cache invalidation URL: ${e}`);
    return 1;
  }
}

async function updateCache(cacheUpdateUrlInfo, logger) {
  try {
    logger.log(`\tInvalidating ${cacheUpdateUrlInfo.cacheName}`);
    const response = await fetch(cacheUpdateUrlInfo.updateCacheUrl);
    if (response.status !== 200) {
      throw new Error(`Error Invalidating Cache URL: ${cacheUpdateUrlInfo.updateCacheUrl}`);
    }
    logger.log('\tSuccess!');
  } catch (e) {
    logger.error(`Error invalidating Cache URL: ${e}`);
  }
}

module.exports = async (args, logger) => {
  const canonicalUrl = args._[1];
  const privateKeyFile = args.privateKey || './privateKey.pem';

  if (!canonicalUrl) {
    logger.error('Missing URL');
    return 1;
  }

  if (!fs.existsSync(privateKeyFile)) {
    logger.error(`${privateKeyFile} does not exist`);
    return 1;
  }

  try {
    const privateKey = fs.readFileSync(privateKeyFile, 'utf8');
    return await updateCaches(privateKey, canonicalUrl, logger);
  } catch (e) {
    logger.error(`Error reading Private Key: ${privateKeyFile}`);
    return 1;
  }
};
