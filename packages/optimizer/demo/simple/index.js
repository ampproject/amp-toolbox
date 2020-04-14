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

const util = require('util');
const glob = util.promisify(require('glob'));
const fsPromises = require('fs').promises;
const path = require('path');

const AmpOptimizer = require('../../index.js');
const {createElement, firstChildByTag, appendChild} = require('../../lib/NodeUtils.js');

const runtimeVersion = require('@ampproject/toolbox-runtime-version');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');

// Simple demo transforming a valid AMP file, this is the recommended way
// to use AMP Optimizer
async function validAmpTransformation(filePath, html) {
  const optimizer = AmpOptimizer.create();
  const transformedHtml = await optimizer.transformHtml(html);
  await writeFile('valid', filePath, transformedHtml);
}

// Advanced demo performing transformations resulting in invalid AMP using
// paired mode to link to the valid AMP version.
async function pairedAmpTransformation(filePath, html) {
  const optimizer = AmpOptimizer.create({
    transformations: AmpOptimizer.TRANSFORMATIONS_PAIRED_AMP,
  });
  const ampFilePath = filePath.substring(1, filePath.length).replace('.html', '.amp.html');
  const transformedHtml = await optimizer.transformHtml(html, {
    // needed to calculate the `<link rel=amphtml href=${ampUrl}>`
    ampUrl: ampFilePath,
    // sets the AMP runtime version to the latest release
    ampRuntimeVersion: await runtimeVersion.currentVersion(),
    // enables blurry image placeholder generation
    blurredPlaceholders: true,
  });
  await writeFile('paired', filePath, transformedHtml);
  await writeFile('paired', ampFilePath, html);
}

// Demo how to implement a custom transformer
async function customAmpTransformation(filePath, html) {
  // Transformers are easy to implement and integrate
  class CustomTransformer {
    constructor(config) {
      this.log_ = config.log.tag('CUSTOM');
    }
    transform(tree, params) {
      this.log_.info('Running custom transformation for ', params.filePath);
      const html = firstChildByTag(tree, 'html');
      if (!html) return;
      const head = firstChildByTag(html, 'head');
      if (!head) return;
      const desc = createElement('meta', {
        name: 'description',
        content: 'this is just a demo',
      });
      appendChild(head, desc);
    }
  }

  // it's best to run custom transformers first
  const customTransformations = [CustomTransformer, ...AmpOptimizer.TRANSFORMATIONS_AMP_FIRST];

  // pass custom transformers when creating the optimizer
  const optimizer = AmpOptimizer.create({
    transformations: customTransformations,
  });
  // you can add custom parameters on a per document basis
  const transformedHtml = await optimizer.transformHtml(html, {
    filePath,
  });
  await writeFile('custom', filePath, transformedHtml);
}

// Demo how to implement a custom transformer
async function manuallySelectingTransformations(filePath, html) {
  // select every transformer explicitly
  const customTransformations = [
    // Applies server-side-rendering optimizations
    'ServerSideRendering',
    // Removes ⚡ or 'amp' from the html tag
    'RemoveAmpAttribute',
    // Removes the boilerplate
    // needs to run after ServerSideRendering
    'AmpBoilerplateTransformer',
    // Optimizes script import order
    // needs to run after ServerSideRendering
    'ReorderHeadTransformer',
    // needs to run after ReorderHeadTransformer
    'RewriteAmpUrls',
    // optimmize google fonts (if used)
    'GoogleFontsPreconnect',
    // clean up preloads
    'PruneDuplicateResourceHints',
    // Optimize CSS
    'SeparateKeyframes',
    // Support inline amp-script
    'AmpScriptCsp',
    // Mark as transformed
    'AddTransformedFlag',
  ];

  // pass custom transformers when creating the optimizer
  const optimizer = AmpOptimizer.create({
    transformations: customTransformations,
  });
  // run the transformation
  const transformedHtml = await optimizer.transformHtml(html, {
    filePath,
  });
  await writeFile('manual', filePath, transformedHtml);
}

// Run transforms in parallel
[
  validAmpTransformation,
  pairedAmpTransformation,
  customAmpTransformation,
  manuallySelectingTransformations,
].forEach(async (transform) => {
  const files = await collectInputFiles('/**/*.html');
  files.forEach(async (filePath) => {
    const html = await readFile(filePath);
    transform(filePath, html);
  });
});

// Collect all files in the src dir.
async function collectInputFiles(pattern) {
  return glob(pattern, {root: SRC_DIR, nomount: true});
}

async function readFile(fileName) {
  const filePath = path.join(SRC_DIR, fileName);
  return fsPromises.readFile(filePath, 'utf8');
}

async function writeFile(folder, filePath, content) {
  filePath = path.join(DIST_DIR, folder, filePath);
  await fsPromises.mkdir(path.dirname(filePath), {recursive: true});
  return fsPromises.writeFile(filePath, content);
}
