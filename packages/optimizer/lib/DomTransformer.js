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

const treeParser = require('./TreeParser');
const log = require('./log');
let fetch = require('node-fetch');
const RuntimeVersion = require('@ampproject/toolbox-runtime-version/lib/RuntimeVersion');
const fetchRuntimeParameters = require('./fetchRuntimeParameters');
const cache = require('./cache.js');

/**
 * AMP Optimizer Configuration only applying AMP validity perserving transformations.
 */
const TRANSFORMATIONS_AMP_FIRST = [
  // Adds missing AMP tags
  'AddMandatoryTags',
  // Optional Markdown compatibility
  // needs to run before ServerSideRendering
  'Markdown',
  // Adds missing AMP extensions
  'AutoExtensionImporter',
  // Applies image optimizations, must run before PreloadHeroImage
  'OptimizeImages',
  // Detect hero image and preload link rel=preload, needs to run after OptimizeImages
  'OptimizeHeroImages',
  // Inject a querySelectorAll query-able i-amphtml-binding attribute on elements with bindings.
  // This needs to run after AutoExtensionImporter.
  'OptimizeAmpBind',
  // Applies server-side-rendering optimizations
  'ServerSideRendering',
  // Removes the boilerplate
  // needs to run after ServerSideRendering
  'AmpBoilerplateTransformer',
  'RewriteAmpUrls',
  // Adds amp-onerror to disable boilerplate early
  // needs to run after BoilerplateTransformer and rewrite AMP URLs
  'AmpBoilerplateErrorHandler',
  'GoogleFontsPreconnect',
  'PruneDuplicateResourceHints',
  'AddBlurryImagePlaceholders',
  // Move keyframes into a separate style tag
  'SeparateKeyframes',
  // Optimizes script import order
  // needs to run after ServerSideRendering
  'ReorderHeadTransformer',
  'AddTransformedFlag',
  // Minifies HTML, JSON, inline amp-script
  'MinifyHtml',
  // Inject CSP script has required for inline amp-script
  // needs to run after MinifyHtml which changes the inline script
  'AmpScriptCsp',
];

/**
 * AMP Optimizer Configuration for transformations resulting in invalid AMP pages setting up paired AMP mode.
 *
 * @deprecated
 */
const TRANSFORMATIONS_PAIRED_AMP = [
  // Adds missing AMP extensions
  'AutoExtensionImporter',
  // Adds a link to the valid AMP version
  'AddAmpLink',
  // Applies image optimizations, must run before PreloadHeroImage
  'OptimizeImages',
  // Detect hero image and preload link rel=preload
  'OptimizeHeroImages',
  // Inject a querySelectorAll query-able i-amphtml-binding attribute on elements with bindings.
  // This needs to run after AutoExtensionImporter.
  'OptimizeAmpBind',
  // Applies server-side-rendering optimizations
  'ServerSideRendering',
  // Removes ⚡ or 'amp' from the html tag
  'RemoveAmpAttribute',
  // Removes the boilerplate
  // needs to run after ServerSideRendering
  'AmpBoilerplateTransformer',
  'RewriteAmpUrls',
  // Adds amp-onerror to disable boilerplate early
  // needs to run after BoilerplateTransformer and rewrite AMP URLs
  'AmpBoilerplateErrorHandler',
  'GoogleFontsPreconnect',
  'PruneDuplicateResourceHints',
  'AddBlurryImagePlaceholders',
  'SeparateKeyframes',
  'AddTransformedFlag',
  // Optimizes script import order
  // needs to run after ServerSideRendering
  'ReorderHeadTransformer',
  // Minifies HTML, JSON, inline amp-script
  'MinifyHtml',
  // Inject CSP script has required for inline amp-script
  // needs to run after MinifyHtml which changes the inline script
  'AmpScriptCsp',
];

const CONFIG_DEFAULT = {
  cache,
  fetch,
  log,
  profile: false,
  transformations: TRANSFORMATIONS_AMP_FIRST,
  verbose: false,
  // keep these enabled for backward compatibility
  autoAddMandatoryTags: true,
  autoExtensionImport: true,
  esmModulesEnabled: true,
  markdown: true,
  minify: true,
  optimizeAmpBind: true,
  optimizeHeroImages: true,
  separateKeyframes: true,
};

const CONFIG_BUILD = Object.assign({}, CONFIG_DEFAULT, {
  autoAddMandatoryTags: true,
  autoExtensionImport: true,
  esmModulesEnabled: true,
  markdown: true,
  minify: true,
  optimizeAmpBind: true,
  optimizeHeroImages: true,
  separateKeyframes: true,
});

const CONFIG_RUNTIME = Object.assign({}, CONFIG_DEFAULT, {
  autoAddMandatoryTags: false,
  autoExtensionImport: false,
  esmModulesEnabled: true,
  markdown: false,
  minify: false,
  optimizeAmpBind: true,
  optimizeHeroImages: true,
  separateKeyframes: false,
});

/**
 * Applies a set of transformations to a DOM tree.
 */
class DomTransformer {
  /**
   * Create a DomTransformer.
   * @param {Object} config - The config.
   * @param {Array.<Transformer>} config.transformers - a list of transformers to be applied.
   */
  constructor(config = CONFIG_DEFAULT) {
    this.setConfig(config);
  }

  /**
   * Transforms an html string.
   * @param {string} html - a string containing valid HTML.
   * @param {Object} params - a dictionary containing transformer specific parameters.
   * @return {string} - the transformed html string
   */
  async transformHtml(html, params) {
    const tree = await treeParser.parse(html);
    await this.transformTree(tree, params);
    return treeParser.serialize(tree);
  }

  /**
   * Transforms a DOM tree.
   * @param {Tree} tree - a DOM tree.
   * @param {Object} customParams - a dictionary containing transformer specific parameters.
   */
  async transformTree(tree, customParams = {}) {
    log.verbose(customParams.verbose || false);
    const runtimeParameters = await fetchRuntimeParameters(this.config, customParams);
    for (const transformer of this.transformers_) {
      if (this.config.profile) {
        console.time(this.getTransformerId(transformer));
      }
      await transformer.transform(tree, runtimeParameters);
      if (this.config.profile) {
        console.timeEnd(this.getTransformerId(transformer));
      }
    }
  }

  /**
   * Set the config.
   * @param {Object} config - The config.
   * @param {boolean} config.verbose - true if verbose mode should be enabled [default: false].
   * @param {Object} config.fetch - the fetch implementation to use.
   * @param {Array.<Transformer>} config.transformations - a list of transformers to be applied.
   */
  setConfig(config) {
    this.config = Object.assign({}, CONFIG_DEFAULT, config);
    if (!this.config.runtimeVersion) {
      // Re-use custom fetch implementation for runtime version provider
      this.config.runtimeVersion = new RuntimeVersion(this.config.fetch);
    }
    log.verbose(this.config.verbose);
    this.initTransformers_(this.config);
  }

  /**
   * @private
   */
  initTransformers_(config) {
    this.transformers_ = config.transformations.map((Transformer) => {
      if (typeof Transformer === 'string') {
        Transformer = require(`./transformers/${Transformer}.js`);
      }
      return new Transformer(config);
    });
  }

  getTransformerId(transformer) {
    return transformer.constructor ? transformer.constructor.name : 'custom';
  }
}

module.exports = {
  DomTransformer,
  CONFIG_BUILD,
  CONFIG_RUNTIME,
  TRANSFORMATIONS_AMP_FIRST,
  TRANSFORMATIONS_PAIRED_AMP,
};
