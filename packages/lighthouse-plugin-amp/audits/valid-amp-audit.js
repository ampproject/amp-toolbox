/**
 * @license Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const Audit = require('lighthouse').Audit;
const amphtmlValidator = require('amphtml-validator');
const fetch = require('node-fetch');

const TABLE_COLUMN_HEADINGS = [
  {
    key: 'line',
    text: 'Location',
    itemType: 'text',
  },
  {
    key: 'msg',
    text: 'Error',
    itemType: 'text',
  },
  {
    key: 'url',
    text: 'URL',
    itemType: 'url',
  },
];

/**
 * @fileoverview Validates page against the AMP HTML spec.
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
    };
  }

  static async audit(artifacts) {
    let result;
    const tableItems = [];
    let tableDetails;
    const pageUrl = artifacts.URL.requestedUrl;
    const fetchPageErrorMsg = 'Page' + pageUrl + ' not found';

    const validator = await amphtmlValidator.getInstance();
    const response = await fetch(pageUrl);
    if (response && response.ok) {
      // Validate page.
      const body = await response.text();
      result = validator.validateString(body);
      result.errors.forEach((error) => {
        const lineDetails = 'line ' + error.line + ', col ' + error.col;
        tableItems.push({line: lineDetails, msg: error.message, url: error.specUrl});
      });
      // Generate table of validation errors.
      tableDetails = Audit.makeTableDetails(TABLE_COLUMN_HEADINGS, tableItems, '');
    } else {
      throw new Error(fetchPageErrorMsg);
    }

    return {
      score: result.status === 'PASS' ? 1 : 0,
      details: tableDetails,
    };
  }
}
module.exports = ValidAmpAudit;
