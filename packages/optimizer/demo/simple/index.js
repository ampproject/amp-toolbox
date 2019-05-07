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

const glob = require('glob');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const AmpOptimizer = require('../../index.js');

const runtimeVersion = require('amp-toolbox-runtime-version');

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');

// Simple demo transforming a valid AMP file, this is the recommended way
// to use AMP Optimizer
async function validAmpTransformation(filePath, html) {
  const optimizer = AmpOptimizer.create();
  const transformedHtml = await optimizer.transformHtml(html);
  writeFile('valid', filePath, transformedHtml);
}

// Advanced demo performing transformations resulting in invalid AMP using
// paired mode to link to the valid AMP version.
async function pairedAmpTransformation(filePath, html) {
  const ampRuntimeVersion = await runtimeVersion.currentVersion();
  const optimizer = AmpOptimizer.create({
    transformations: AmpOptimizer.TRANSFORMATIONS_PAIRED_AMP,
  });
  const ampFilePath = filePath.substring(1, filePath.length)
      .replace('.html', '.amp.html');
  const transformedHtml = await optimizer.transformHtml(html, {
    ampUrl: ampFilePath,
    ampRuntimeVersion: ampRuntimeVersion,
  });
  writeFile('paired', filePath, transformedHtml);
  writeFile('paired', ampFilePath, html);
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
      const html = tree.root.firstChildByTag('html');
      if (!html) return;
      const head = html.firstChildByTag('head');
      if (!head) return;
      const desc = tree.createElement('meta', {
        name: 'description',
        content: 'this is just a demo',
      });
      head.appendChild(desc);
    }
  }

  // it's best to run custom transformers first
  const customTransformations = [CustomTransformer].concat(AmpOptimizer.TRANSFORMATIONS_AMP_FIRST);

  // pass custom transformers when creating the optimizer
  const optimizer = AmpOptimizer.create({
    transformations: customTransformations,
  });
  // you can add custom parameters on a per document basis
  const transformedHtml = await optimizer.transformHtml(html, {
    filePath,
  });
  writeFile('custom', filePath, transformedHtml);
}

[
  validAmpTransformation,
  pairedAmpTransformation,
  customAmpTransformation,
].forEach(async (transform) => {
  const files = await collectInputFiles('/**/*.html');
  files.forEach(async (filePath) => {
    const html = await readFile(filePath);
    transform(filePath, html);
  });
});

// Collect all files in the src dir.
function collectInputFiles(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, {root: SRC_DIR, nomount: true}, (err, files) => {
      if (err) {
        return reject(err);
      }
      resolve(files);
    });
  });
}

function readFile(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(SRC_DIR, fileName);
    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }
      resolve(contents);
    });
  });
}

function writeFile(folder, filePath, content) {
  filePath = path.join(DIST_DIR, folder, filePath);
  mkdirp(path.dirname(filePath), (err) => {
    if (err) {
      throw err;
    }
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        throw err;
      }
    });
  });
}

