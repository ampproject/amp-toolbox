/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const RuntimeVersion = require('@ampproject/toolbox-runtime-version/lib/RuntimeVersion');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');
const fetchRuntimeParameters = require('../lib/fetchRuntimeParameters');

(async () => {
  const runtimeParameters = await fetchRuntimeParameters({
    runtimeVersion: new RuntimeVersion(fetch),
    fetch,
    cache: false,
    log: console,
  });

  const runtimeData = {
    ampRuntimeStyles: runtimeParameters.ampRuntimeStyles,
    ampRuntimeVersion: runtimeParameters.ampRuntimeVersion,
  };

  fs.writeFile(
    path.join(__dirname, '../lib/runtimeData.json'),
    JSON.stringify(runtimeData),
    'utf-8'
  );

  const extensionConfigUrl =
    'https://raw.githubusercontent.com/ampproject/amphtml/main/build-system/compile/bundles.config.extensions.json';
   const response = await fetch(extensionConfigUrl);
  if (!response.ok) {
    throw new Error(`Failed downloading ${extensionConfigUrl} with status ${response.status}`);
  }
  const extensionConfig = await response.json();
  fs.writeFile(
    path.join(__dirname, '../lib/extensionConfig.json'),
    JSON.stringify(extensionConfig),
    'utf-8'
  );
})();
