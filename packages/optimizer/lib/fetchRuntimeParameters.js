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

const URL_COMPONENT_VERSIONS =
  'https://raw.githubusercontent.com/ampproject/amphtml/main/build-system/compile/bundles.config.extensions.json';
const validatorRulesProvider = require('@ampproject/toolbox-validator-rules');
const {MaxAge} = require('@ampproject/toolbox-core');
let fallbackRuntime;

try {
  fallbackRuntime = require('./runtimeData.json');
} catch (e) {
  // `npm run build` has not been executed
  fallbackRuntime = {ampRuntimeStyles: '', ampRuntimeVersion: ''};
}

const {
  AMP_CACHE_HOST,
  AMP_RUNTIME_CSS_PATH,
  AMP_VALIDATION_RULES_URL,
  appendRuntimeVersion,
} = require('./AmpConstants.js');

const KEY_VALIDATOR_RULES = 'validator-rules';
const AMP_RUNTIME_MAX_AGE = 10 * 60; // 10 min
let cacheErrorLogged = false;

/**
 * Initializes the runtime parameters used by the transformers based on given config and parameter values.
 * If missing, the following parameters are fetched from cdn.ampproject.org:
 *
 * - validatorRules: the latest version of the AMP validator rules as served from https://cdn.ampproject.org/v0/validator.json
 * - ampRuntimeVersion: the latest AMP runtime version or the latest lts version if the lts flag is set
 * - ampRuntimeStyles: the latest AMP runtime CSS styles or the latest lts CSS styles if the lts flag is set
 *
 * @param {Object} config - the AMP Optimizer config
 * @param {Object} customRuntimeParameters - user defined runtime parameters
 * @returns {Promise<Object>} - the runtime parameters
 */
async function fetchRuntimeParameters(config, customRuntimeParameters = {}) {
  const runtimeParameters = Object.assign({}, customRuntimeParameters);
  // Configure the log level
  runtimeParameters.verbose = customRuntimeParameters.verbose || config.verbose || false;
  await initRuntimeVersion(runtimeParameters, customRuntimeParameters, config);
  // Runtime Styles depend on the Runtime version
  await initRuntimeStyles(runtimeParameters, config);
  // Validation rules depend on runtime version
  await initValidatorRules(runtimeParameters, customRuntimeParameters, config);
  return runtimeParameters;
}

/**
 * Fetches the AMP validator rules if they're not provided.
 *
 * @private
 */
async function initValidatorRules(runtimeParameters, customRuntimeParameters, config) {
  if (!config.autoExtensionImport) {
    // Validation rules are large, don't import if not needed
    return;
  }
  try {
    runtimeParameters.validatorRules =
      customRuntimeParameters.validatorRules ||
      config.validatorRules ||
      (await fetchValidatorRulesFromCache_(config));
  } catch (error) {
    config.log.error('Could not fetch validator rules');
    config.log.verbose(error);
  }
  try {
    runtimeParameters.componentVersions =
      customRuntimeParameters.componentVersions ||
      config.componentVersions ||
      (await fetchComponentVersionsFromCache_(config, runtimeParameters));
  } catch (error) {
    config.log.error('Could not fetch latest component versions from amp.dev');
    config.log.verbose(error);
    runtimeParameters.componentVersions = [];
  }
}
async function fetchComponentVersionsFromCache_(config, runtimeParameters) {
  const cacheKey = `component-versions-${runtimeParameters.ampRuntimeVersion}`;
  let componentVersions = await readFromCache_(config, cacheKey);
  if (!componentVersions) {
    try {
      componentVersions = await fetchComponentVersions_(config, runtimeParameters);
      writeToCache_(config, cacheKey, componentVersions);
    } catch (e) {
      config.log.warn(e.message);
      componentVersions = require('./extensionConfig.json');
    }
  }
  return componentVersions;
}

async function fetchComponentVersions_(config, runtimeParameters) {
  // Strip the leading two chars from the version identifier to get the release tag
  const releaseTag = runtimeParameters.ampRuntimeVersion.substring(2);
  const componentConfigUrl = `https://raw.githubusercontent.com/ampproject/amphtml/${releaseTag}/build-system/compile/bundles.config.extensions.json`;

  const response = await config.fetch(componentConfigUrl);
  if (!response.ok) {
    throw new Error(
      `Failed fetching latest component versions from ${URL_COMPONENT_VERSIONS} with status: ${response.status}`
    );
  }
  return response.json();
}

/**
 * @private
 */
async function fetchValidatorRulesFromCache_(config) {
  let rawRules = await readFromCache_(config, 'validator-rules');
  let validatorRules;
  if (!rawRules) {
    validatorRules = await fetchValidatorRules_(config);
    config.log.debug('Downloaded AMP validation rules');
    // We save the raw rules to make the validation rules JSON serializable
    writeToCache_(config, KEY_VALIDATOR_RULES, validatorRules.raw);
  } else {
    validatorRules = await validatorRulesProvider.fetch({rules: rawRules});
  }
  return validatorRules;
}

async function fetchValidatorRules_(config) {
  const response = await config.fetch(AMP_VALIDATION_RULES_URL);
  if (!response.ok) {
    return null;
  }
  return validatorRulesProvider.fetch({rules: await response.json()});
}

/**
 * Fetch runtime styles based on the runtime version
 *
 * @private
 */
async function initRuntimeStyles(runtimeParameters, config) {
  try {
    runtimeParameters.ampRuntimeStyles =
      runtimeParameters.ampRuntimeStyles ||
      (await fetchAmpRuntimeStyles_(
        config,
        runtimeParameters.ampUrlPrefix,
        runtimeParameters.ampRuntimeVersion
      ));
  } catch (error) {
    config.log.warn('Could not fetch AMP runtime CSS, falling back to built-in runtime styles.');
    config.log.verbose(error);
    // fallback to build-in runtime
    runtimeParameters.ampRuntimeStyles = fallbackRuntime.ampRuntimeStyles;
  }
}

/**
 * Use provided runtime version or fetch latest (lts) version.
 *
 * @private
 */
async function initRuntimeVersion(runtimeParameters, customRuntimeParameters, config) {
  // Copy lts and rtv runtime flag from custom parameters or the static config. Both are disabled by default.
  runtimeParameters.lts = customRuntimeParameters.lts || config.lts || false;
  runtimeParameters.rtv = customRuntimeParameters.rtv || config.rtv || false;
  let {ampUrlPrefix, ampRuntimeVersion, lts} = runtimeParameters;
  if (lts && ampRuntimeVersion) {
    config.log.warn(
      '`ampRuntimeVersion` and `lts` cannot be defined at the same time. Using LTS version.'
    );
    ampRuntimeVersion = '';
  }
  runtimeParameters.ampRuntimeVersion =
    ampRuntimeVersion || (await fetchAmpRuntimeVersion_({config, ampUrlPrefix, lts}));
}

/**
 * @private
 */
async function fetchAmpRuntimeVersion_(context) {
  const versionKey = `version-${context.ampUrlPrefix}-${context.lts}`;
  let ampRuntimeData = await readFromCache_(context.config, versionKey);
  if (!ampRuntimeData) {
    ampRuntimeData = await fetchLatestRuntimeData_(context, versionKey);
    context.config.log.debug('Downloaded AMP runtime v' + ampRuntimeData.version);
  } else if (MaxAge.fromObject(ampRuntimeData.maxAge).isExpired()) {
    // return the cached version, but update the cache in the background
    fetchLatestRuntimeData_(versionKey, context);
  }
  return ampRuntimeData.version;
}

/**
 * @private
 */
async function fetchLatestRuntimeData_({config, ampUrlPrefix, lts}, versionKey = null) {
  let ampRuntimeData;
  ampRuntimeData = {
    version: await config.runtimeVersion.currentVersion({ampUrlPrefix, lts}),
    maxAge: MaxAge.create(AMP_RUNTIME_MAX_AGE).toObject(),
  };
  if (!ampRuntimeData.version && ampUrlPrefix && ampUrlPrefix !== AMP_CACHE_HOST) {
    config.log.error(
      `Could not download runtime version from ${ampUrlPrefix}. Falling back to ${AMP_CACHE_HOST}`
    );
    ampRuntimeData = await fetchLatestRuntimeData_(
      {config, ampUrlPrefix: AMP_CACHE_HOST, lts},
      versionKey
    );
  } else if (!ampRuntimeData.version) {
    config.log.warn(
      'Could not fetch latest AMP runtime version, falling back to bundled runtime styles.'
    );
    // Fallback to built-in runtime version
    ampRuntimeData.version = fallbackRuntime.ampRuntimeVersion;
  } else if (ampRuntimeData.version && versionKey) {
    writeToCache_(config, versionKey, ampRuntimeData);
  }
  return ampRuntimeData;
}

/**
 * @private
 */
async function fetchAmpRuntimeStyles_(config, ampUrlPrefix, ampRuntimeVersion) {
  if (ampUrlPrefix && !isAbsoluteUrl_(ampUrlPrefix)) {
    config.log.warn(
      `AMP runtime styles cannot be fetched from relative ampUrlPrefix, please use the 'ampRuntimeStyles' parameter to provide the correct runtime style. Falling back to latest v0.css on ${AMP_CACHE_HOST}`
    );
    // Gracefully fallback to latest runtime version
    ampUrlPrefix = AMP_CACHE_HOST;
    ampRuntimeVersion = ampRuntimeVersion || (await config.runtimeVersion.currentVersion());
  }
  // Construct the AMP runtime CSS download URL, the default is: https://cdn.ampproject.org/rtv/${ampRuntimeVersion}/v0.css
  const runtimeCssUrl =
    appendRuntimeVersion(ampUrlPrefix || AMP_CACHE_HOST, ampRuntimeVersion) + AMP_RUNTIME_CSS_PATH;
  // Fetch runtime styles
  const styles = await downloadAmpRuntimeStyles_(config, runtimeCssUrl);
  if (!styles) {
    config.log.warn(`Could not download ${runtimeCssUrl}. Falling back to bundled v0.css.`);
    if (ampUrlPrefix || ampRuntimeVersion) {
      // Try to download latest from cdn.ampproject.org instead
      return fetchAmpRuntimeStyles_(
        config,
        AMP_CACHE_HOST,
        await config.runtimeVersion.currentVersion()
      );
    } else {
      return '';
    }
  }
  return styles;
}

/**
 * @private
 */
async function downloadAmpRuntimeStyles_(config, runtimeCssUrl) {
  let styles;
  if (config.cache !== false) {
    styles = await readFromCache_(config, runtimeCssUrl);
  }
  if (!styles) {
    const response = await config.fetch(runtimeCssUrl);
    if (!response.ok) {
      return null;
    }
    styles = await response.text();
    // HACK: patch v0.css to support transforming amp-img -> img
    // TODO remove once v0.css has been updated
    if (!styles.includes('i-amphtml-ssr')) {
      styles += `amp-img[i-amphtml-ssr]:not(.i-amphtml-element):not([layout=container])>*{display: block;}`;
    }
    config.log.debug(`Downloaded AMP runtime styles from ${runtimeCssUrl}`);
    if (config.cache !== false) {
      writeToCache_(config, runtimeCssUrl, styles);
    }
  }
  return styles;
}

/**
 * @private
 */
function isAbsoluteUrl_(url) {
  try {
    new URL(url);
    return true;
  } catch (ex) {
    return false;
  }
}

/**
 * @private
 */
function readFromCache_(config, key) {
  if (config.cache === false) {
    return null;
  }
  try {
    return config.cache.get(key);
  } catch (e) {
    if (!cacheErrorLogged) {
      config.log.warn('Could not read from cache', e);
      cacheErrorLogged = true;
    }
  }
}

/**
 * @private
 */
function writeToCache_(config, key, value) {
  if (config.cache === false) {
    return;
  }
  try {
    config.cache.set(key, value);
  } catch (e) {
    if (!cacheErrorLogged) {
      config.log.warn('Could not write to cache', e);
      cacheErrorLogged = true;
    }
  }
}
module.exports = fetchRuntimeParameters;
