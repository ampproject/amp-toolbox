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
let fetch = require('cross-fetch');
const RuntimeVersion = require('@ampproject/toolbox-runtime-version/lib/RuntimeVersion');
const fetchRuntimeParameters = require('./fetchRuntimeParameters');
const cache = require('./cache');

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
  // Applies amp-story related optimizations such as appending a link[rel=stylesheet]
  // to the amp-story css, server side rendering attributes, and adding css polyfills
  // and fixes.
  'AmpStoryCssTransformer',
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
  // Applies amp-story related optimizations such as appending a link[rel=stylesheet]
  // to the amp-story css, server side rendering attributes, and adding css polyfills
  // and fixes.
  'AmpStoryCssTransformer',
  // Applies server-side-rendering optimizations
  'ServerSideRendering',
  // Removes ⚡ or 'amp' from the html tag
  'RemoveAmpAttribute',
  // Removes the boilerplate
  // needs to run after ServerSideRendering
  'AmpBoilerplateTransformer',
  // Needs to come after AmpBoilerplateTransformer.
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

/**
 * AMP Optimizer Configuration only applying the minimal set of AMP transformations ensuring maximum performance.
 */
const TRANSFORMATIONS_MINIMAL = [
  // Applies image optimizations, must run before PreloadHeroImage
  'OptimizeImages',
  // Detect hero image and preload link rel=preload, needs to run after OptimizeImages
  'OptimizeHeroImages',
  // Inject a querySelectorAll query-able i-amphtml-binding attribute on elements with bindings.
  // This needs to run after AutoExtensionImporter.
  'OptimizeAmpBind',
  // Applies amp-story related optimizations such as appending a link[rel=stylesheet]
  // to the amp-story css, server side rendering attributes, and adding css polyfills
  // and fixes.
  'AmpStoryCssTransformer',
  // Applies server-side-rendering optimizations
  'ServerSideRendering',
  // Removes the boilerplate
  // needs to run after ServerSideRendering
  'AmpBoilerplateTransformer',
  // Adds amp-onerror to disable boilerplate early
  // needs to run after ServerSideRendering
  'AmpBoilerplateErrorHandler',
  'RewriteAmpUrls',
  'GoogleFontsPreconnect',
  'PruneDuplicateResourceHints',
  // Optimizes script import order
  // needs to run after ServerSideRendering
  'ReorderHeadTransformer',
  'AddTransformedFlag',
];

const DEFAULT_CONFIG = {
  autoExtensionImport: true,
  cache,
  fetch,
  log,
  profile: false,
  profiler: (label) => {
    console.time(label);
    return () => {
      console.timeEnd(label);
    };
  },
  transformations: TRANSFORMATIONS_AMP_FIRST,
  verbose: false,
};

/**
 * Applies a set of transformations to a DOM tree.
 */
class DomTransformer {
  /**
   * Create a DomTransformer.
   * @param {Object} config - The config.
   * @param {Array.<Transformer>} config.transformers - a list of transformers to be applied.
   */
  constructor(config = DEFAULT_CONFIG) {
    this.setConfig(config);
  }

  /**
   * Transforms an html string.
   * @param {string} html - a string containing valid HTML.
   * @param {Object} params - a dictionary containing transformer specific parameters.
   * @return {string} - the transformed html string
   */
  async transformHtml(html, params) {
    async function transform() {
      const tree = await this.doProfile('parsing', () => treeParser.parse(html));

      await this.doProfile('transform', () => this.transformTree(tree, params));

      return this.doProfile('serialization', () => treeParser.serialize(tree));
    }

    return await this.doProfile('overall', () => transform.call(this));
  }

  async doProfile(name, f) {
    if (!this.config.profile) {
      return f();
    }
    const endOfTimer = this.config.profiler(name);
    try {
      return await f();
    } finally {
      endOfTimer();
    }
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
      const transformerId = this.getTransformerId(transformer);
      await this.doProfile(transformerId, () => transformer.transform(tree, runtimeParameters));
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
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
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
  DEFAULT_CONFIG,
  TRANSFORMATIONS_AMP_FIRST,
  TRANSFORMATIONS_PAIRED_AMP,
  TRANSFORMATIONS_MINIMAL,
};
