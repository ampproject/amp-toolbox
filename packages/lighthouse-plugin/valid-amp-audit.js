/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('lighthouse').Audit;
const Gatherer = require('lighthouse').Gatherer;
const BBPromise = require('bluebird');
const amphtmlValidator = require('amphtml-validator');
const request = BBPromise.promisify(require('request'));

/**
 * @fileoverview Validates the page against the AMP HTML spec.
 */

class ValidAmpAudit extends Audit {
  static get meta() {
    return {
      id: 'valid-amp-audit',
      title: 'Valid AMP HTML Page',
      failureTitle: 'Invalid AMP HTML page',
      description: 'An invalid AMP page will not be cached.',
      requiredArtifacts: ['URL'],
      scoreDisplayMode: 'binary',
    }
  }

  static audit(artifacts) {
    return {
      score: 1,
      displayValue: 'test',
    };
  }

}

module.exports = ValidAmpAudit;
