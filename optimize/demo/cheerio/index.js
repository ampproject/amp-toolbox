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

// @ts-check
'use strict';

const fs = require('fs');

const optimize = require('amp-toolbox-optimize');
const cheerio = require('cheerio');

if (process.argv.length !== 3 || !fs.existsSync(process.argv[2])) {
  process.stderr.write([
    'usage:',
    process.argv[0],
    process.argv[1],
    'filename'
  ].join(' '));
  process.exit(1);
}

const FILENAME = process.argv[2];

class CheerioTransformer {

  /**
   * More about tree's type: tree is a parse5
   * [Document](http://inikulin.github.io/parse5/modules/ast.html#document),
   * with the htmlparser2
   * [TreeAdapter](http://inikulin.github.io/parse5/globals.html#treeadapters),
   * which results in a tree that's mostly compatible with that of
   * [htmlparser2](https://github.com/fb55/htmlparser2/). (Though note that
   * TreeParser.js itself monkey-patches some additional methods.)
   *
   * More about params' type: this is the second argument of
   * DomTransformer.transformHtml(), and is (probably) an object of key-value
   * pairs.
   *
   * @param {parse5.AST.HtmlParser2.Document} tree a DOM tree
   * @param {Object} params transformer options
   */
  transform(tree, params) {
    const $ = cheerio.load(tree.root.children);
    // Prepends "Optimize" to the <title>
    $('title').text('Optimize: ' + $('title').text());
    // Injects amp-fx-parallax component
    $('head').append(
      '<script async custom-element="amp-fx-parallax" src="https://cdn.ampproject.org/v0/amp-fx-parallax-0.1.js"></script>'
    );
    // Enables parallax scrolling
    $('h1').attr('amp-fx-parallax', params.ampFxParallax);
    // Enables the component
    $('body').append([
      '<script>',
      'document.cookie="AMP_EXP=amp-fx-parallax;Path=/;Expires=Tue, 01-Jan-2036 08:00:01 GMT"',
      '</script>'
    ].join(''));
    // See the docs for other methods:
    // https://github.com/cheeriojs/cheerio/blob/master/Readme.md
  }
}

optimize.setConfig({
  transformers: [
    new CheerioTransformer(),
    'AddAmpLink',
    'ServerSideRendering',
    'RemoveAmpAttribute',
    // needs to run after ServerSideRendering
    'AmpBoilerplateTransformer',
    // needs to run after ServerSideRendering
    'ReorderHeadTransformer'
  ]
});

console.log(optimize.transformHtml(
  fs.readFileSync(FILENAME, 'utf8'),
  {ampFxParallax: '1.7'}
));

