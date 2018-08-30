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
const errorRegex = /<br><br>\s+(.+?)\s+<ins>/;

async function updateCaches(privateKey, url, logger) {
  logger.log(`Invalidating AMP Caches for ${url}`);
  try {
    const updateCacheUrlProvider = UpdateCacheUrlProvider.create(privateKey);
    const cacheUpdateUrls = await updateCacheUrlProvider.calculateFromOriginUrl(url);
    cacheUpdateUrls.forEach((cacheUpdateUrl) => updateCache(cacheUpdateUrl, logger));
  } catch (e) {
    throw new Error(`Error generating cache invalidation URL: ${e}`);
  }
}

async function updateCache(cacheUpdateUrlInfo, logger) {
  const tag = cacheUpdateUrlInfo.cacheName;
  logger.log(`Invalidating ${cacheUpdateUrlInfo.cacheName}`, tag);
  logger.log(`Using Invalidation URL: ${cacheUpdateUrlInfo.updateCacheUrl}`, tag);
  let response;
  try {
    response = await fetch(cacheUpdateUrlInfo.updateCacheUrl);
  } catch (e) {
    logger.warn(`Error connecting to the AMP Cache, with message: "${e.message}"`, tag);
  }

  if (response.status !== 200) {
    const body = await response.text();
    const match = errorRegex.exec(body);

    if (match) {
      logger.error(
        `Error Invalidating Cache URL. Received response code "${response.status}" with ` +
        `message: "${match[1]}"`, tag
      );
    } else {
      logger.error(
        `Error Invalidating Cache URL. Received response code "${response.status}" with `+
        'an unknown error', tag
      );
    }
    return;
  }

  logger.success(`${cacheUpdateUrlInfo.cacheName} Updated`, tag);
}

module.exports = async (args, logger) => {
  const canonicalUrl = args._[1];
  const privateKeyFile = args.privateKey || './privateKey.pem';

  if (!canonicalUrl) {
    throw new Error('Missing URL');
  }

  if (!fs.existsSync(privateKeyFile)) {
    throw new Error(`${privateKeyFile} does not exist`);
  }

  let privateKey;
  try {
    privateKey = fs.readFileSync(privateKeyFile, 'utf8');
  } catch (e) {
    throw new Error(`Error reading Private Key: ${privateKeyFile} (${e.message})`);
  }

  await updateCaches(privateKey, canonicalUrl, logger);
};
