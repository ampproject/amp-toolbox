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

const path = require('path');

const downloadRuntimeProvider = require('@ampproject/toolbox-runtime-fetch');

async function downloadRuntime(args, _) {
  const {host, clear, dest, rtv} = args;
  const ret = await downloadRuntimeProvider.getRuntime({
    ampUrlPrefix: host,
    clear,
    dest: dest || process.cwd(),
    rtv,
  });
  if (!ret.status) {
    throw new Error('AMP runtime download did not complete successfully');
  }
}

module.exports = downloadRuntime;
