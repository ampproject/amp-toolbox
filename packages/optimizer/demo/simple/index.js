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

const ampOptimizer = require('amp-toolbox-optimizer');
const runtimeVersion = require('amp-toolbox-runtime-version');

// Transformers are easy to implement and integrate
class CustomTransformer {
  transform(tree /* optional: ', params' */) {
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

// Configure the transformers to be used.
// otherwise a default configuration is used.
ampOptimizer.setConfig({
  transformers: [
    CustomTransformer,
    'AddAmpLink',
    'ServerSideRendering',
    'RemoveAmpAttribute',
    'AmpBoilerplateTransformer',
    'ReorderHeadTransformer',
    'RewriteAmpUrls',
    'GoogleFontsPreconnect',
    'PruneDuplicateResourceHints',
    'AddBlurryImagePlaceholders',
  ],
});

const SRC_DIR = path.join(__dirname, 'src');
const DIST_DIR = path.join(__dirname, 'dist');

runAmpOptimizerTransformations();

async function runAmpOptimizerTransformations() {
  // This is optional in case AMP runtime URLs should be versioned
  const ampRuntimeVersion = await runtimeVersion.currentVersion();
  console.log('amp version: ', ampRuntimeVersion);

  // Collect input files and invoke the transformers
  const files = await collectInputFiles('/**/*.html');
  files.forEach((file) => copyAndTransform(file, ampRuntimeVersion));
}

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

// Copy original and transformed AMP file into the dist dir.
async function copyAndTransform(file, ampRuntimeVersion) {
  const originalHtml = await readFile(file);
  const ampFile = file.substring(1, file.length)
      .replace('.html', '.amp.html');
  // The transformer needs the path to the original AMP document
  // to correctly setup AMP to canonical linking
  const optimizedHtml = await ampOptimizer.transformHtml(originalHtml, {
    ampUrl: ampFile,
    ampRuntimeVersion: ampRuntimeVersion,
  });
  // We change the path of the original AMP file to match the new
  // amphtml link and make the canonical link point to the transformed version.
  writeFile(ampFile, originalHtml);
  writeFile(file, optimizedHtml);
}

function readFile(fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(SRC_DIR, fileName);
    console.log('optimizing', filePath);
    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) {
        return reject(err);
      }
      resolve(contents);
    });
  });
}

function writeFile(filePath, content) {
  filePath = path.join(DIST_DIR, filePath);
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

