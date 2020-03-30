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
const UpdateCacheUrlProvider = require('@ampproject/toolbox-update-cache');
const errorRegex = /<br><br>\s+(.+?)\s+<ins>/;

function updateCaches_(privateKey, url, logger) {
  logger.info(`Invalidating AMP Caches for ${url}`);
  try {
    const updateCacheUrlProvider = UpdateCacheUrlProvider.create(privateKey);
    return updateCacheUrlProvider.calculateFromOriginUrl(url).then((cacheUpdateUrls) => {
      cacheUpdateUrls.forEach((cacheUpdateUrl) => updateCache_(cacheUpdateUrl, logger));
      return;
    });
  } catch (e) {
    return Promise.reject(new Error(`Error generating cache invalidation URL: ${e}`));
  }
}

function updateCache_(cacheUpdateUrlInfo, logger) {
  logger = logger.tag(cacheUpdateUrlInfo.cacheName);
  logger.info(`Invalidating ${cacheUpdateUrlInfo.cacheName}`);
  logger.info(`Using Invalidation URL: ${cacheUpdateUrlInfo.updateCacheUrl}`);

  fetch(cacheUpdateUrlInfo.updateCacheUrl)
    .then((response) => {
      if (response.status === 200) {
        logger.success(`${cacheUpdateUrlInfo.cacheName} Updated`);
        return;
      }
      return response.text().then((body) => {
        const match = errorRegex.exec(body);
        if (match) {
          logger.error(
            `Error Invalidating Cache URL. Received response code "${response.status}" ` +
              `with message: "${match[1]}"`
          );
        } else {
          logger.error(
            `Error Invalidating Cache URL. Received response code "${response.status}"` +
              'with an unknown error'
          );
        }
      });
    })
    .catch((e) => {
      logger.warn(`Error connecting to the AMP Cache with message: "${e.message}"`);
    });
}

function updateCache(args, logger) {
  const canonicalUrl = args._[1];
  const privateKeyFile = args.privateKey || './privateKey.pem';

  if (!canonicalUrl) {
    return Promise.reject(new Error('Missing URL'));
  }

  if (!fs.existsSync(privateKeyFile)) {
    return Promise.reject(new Error(`${privateKeyFile} does not exist`));
  }

  let privateKey;
  try {
    privateKey = fs.readFileSync(privateKeyFile, 'utf8');
  } catch (e) {
    return Promise.reject(new Error(`Error reading Private Key: ${privateKeyFile} (${e.message})`));
  }

  return updateCaches_(privateKey, canonicalUrl, logger);
}

module.exports = updateCache;
