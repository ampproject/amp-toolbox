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
'mode strict';

const validatorRules = require('@ampproject/toolbox-validator-rules');
const {AMP_CACHE_HOST, AMP_RUNTIME_CSS_PATH, appendRuntimeVersion} = require('./AmpConstants.js');

/**
 * Initializes the runtime parameters used by the transformers based on given config and parameter values.
 * If missing, the following parameters are fetched from cdn.ampproject.org:
 *
 * - validatorRules: the latest version of the AMP validator rules as served from https://cdn.ampproject.org/v0/validator.json
 * - ampRuntimeVersion: the latest AMP runtime version or the latest lts version if the lts flag is set
 * - ampRuntimeStules: the latest AMP runtime CSS styles or the latest lts version if the lts flag is set
 *
 * @param {Object} config - the AMP Optimizer config
 * @param {Object} customRuntimeParameters - user defined runtime parameters
 * @returns {Promise<Object>} - the runtime parameters
 */
async function fetchRuntimeParameters(config, customRuntimeParameters) {
  const runtimeParameters = Object.assign({}, customRuntimeParameters);
  // Configure the log level
  runtimeParameters.verbose = customRuntimeParameters.verbose || config.verbose || false;
  // Copy lts and rtv runtime flag from custom parameters or the static config. Both are disabled by default.
  runtimeParameters.lts = customRuntimeParameters.lts || config.lts || false;
  runtimeParameters.rtv = customRuntimeParameters.rtv || config.rtv || false;
  // Fetch the validator rules
  runtimeParameters.validatorRules = config.validatorRules || (await validatorRules.fetch());
  let {ampUrlPrefix, ampRuntimeVersion, ampRuntimeStyles, lts} = runtimeParameters;
  // Use existing runtime version or fetch lts or latest
  runtimeParameters.ampRuntimeVersion =
    ampRuntimeVersion || (await config.runtimeVersion.currentVersion({ampUrlPrefix, lts}));
  // Fetch runtime styles based on the runtime version
  runtimeParameters.ampRuntimeStyles =
    ampRuntimeStyles ||
    (await fetchAmpRuntimeStyles_(config, ampUrlPrefix, runtimeParameters.ampRuntimeVersion));
  return runtimeParameters;
}

/**
 * @private
 */
async function fetchAmpRuntimeStyles_(config, ampUrlPrefix, ampRuntimeVersion) {
  if (ampUrlPrefix && !_isAbsoluteUrl(ampUrlPrefix)) {
    config.log.warn(
      `AMP runtime styles cannot be fetched from relative ampUrlPrefix, please use the 'ampRuntimeStyles' parameter to provide the correct runtime style.`
    );
    // Gracefully fallback to latest runtime version
    ampUrlPrefix = AMP_CACHE_HOST;
    ampRuntimeVersion = ampRuntimeVersion || (await config.runtimeVersion.currentVersion());
  }
  // Construct the AMP runtime CSS download URL, the default is: https://cdn.ampproject.org/rtv/${ampRuntimeVersion}/v0.css
  const runtimeCssUrl =
    appendRuntimeVersion(ampUrlPrefix || AMP_CACHE_HOST, ampRuntimeVersion) + AMP_RUNTIME_CSS_PATH;
  // Fetch runtime styles
  const response = await config.fetch(runtimeCssUrl);
  if (!response.ok) {
    config.log.error(
      `Could not fetch ${runtimeCssUrl}, failed with status ` + `${response.status}.`
    );
    if (ampUrlPrefix || ampRuntimeVersion) {
      // Try to download latest from cdn.ampproject.org instead
      return fetchAmpRuntimeStyles_(AMP_CACHE_HOST, await config.runtimeVersion.currentVersion());
    } else {
      return '';
    }
  }
  return response.text();
}

/**
 * @private
 */
function _isAbsoluteUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (ex) {}

  return false;
}

module.exports = fetchRuntimeParameters;
