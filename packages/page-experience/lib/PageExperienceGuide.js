/**
 * Copyright 2021 The AMPHtml Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const PageDataGatherer = require('./PageDataGatherer');

const {readdir} = require('fs').promises;
const {lint, LintMode} = require('@ampproject/toolbox-linter');
const cheerio = require('cheerio');

const path = require('path');

const CHECK_DIR = path.join(__dirname, 'checks');

/**
 * Collects all page specific recommendations.
 */
class Recommendations {
  constructor() {
    this.results = {
      details: {},
    };
    this.currentCheck = '';
  }

  setCurrentCheck(id) {
    this.currentCheck = id;
  }

  pass(result) {
    this.addResult('PASS', result);
  }

  warn(result) {
    this.addResult('WARN', result);
  }

  fail(result) {
    this.addResult('FAIL', result);
  }

  addDetails(details) {
    this.results.details[this.currentCheck] = details;
  }

  addResult(status, result) {
    result.status = status;
    this.results[this.currentCheck] = result;
  }
}

/**
 * Loads a webpage, runs checks and generates recommendations on how to improve the page to achieve a better page experience.
 */
class PageExperienceGuide {
  constructor(pageDataGatherer = new PageDataGatherer()) {
    this.pageDataGatherer = pageDataGatherer;
  }

  /**
   * Check a single URL.
   *
   * @param {string} url the URL to test
   * @return {Promise<Object>} Recommendations
   */
  async analyze(url, filter = '') {
    await this.setup();
    try {
      return await this.runChecks(url, filter);
    } finally {
      await this.teardown();
    }
  }

  /**
   * Setup the page experience guide. Use when checking multiple URLs in a row. This will start a Puppeteer instance.
   */
  async setup() {
    this.checks = this.loadChecks();
    await this.pageDataGatherer.start();
  }

  /**
   *
   *
   * @param {string} url the URL to test
   * @param {string} filter the id of a specific check that should be run (used for testing)
   * @return {Promise<Object>} Recommendations
   */
  async runChecks(url, filter = '') {
    const pageData = await this.pageDataGatherer.execute(url);
    const pxChecksResult = await this.runPageExperienceChecks(filter, pageData);
    const linterResults = await this.runAmpLinter(filter, pageData);
    return Object.assign(pxChecksResult, linterResults);
  }

  /**
   * Teardown the guide and all running Puppeteer instances.
   */
  async teardown() {
    this.pageDataGatherer.shutdown();
  }

  /**
   * @private
   */
  async runPageExperienceChecks(filter, pageData) {
    let checksToRun = await this.filterChecks(filter);
    const recommendations = new Recommendations();
    for (const check of checksToRun) {
      recommendations.setCurrentCheck(check.id);
      check.execute(pageData, recommendations);
    }
    return recommendations.results;
  }

  /**
   * @private
   */
  async runAmpLinter(filter, pageData) {
    const $ = cheerio.load(pageData.html);

    const context = {
      $,
      headers: {},
      raw: {
        headers: pageData.headers,
        body: pageData.html,
      },
      url: pageData.url,
      mode: LintMode.PageExperience,
    };

    const result = await lint(context);
    if (!filter) {
      return result;
    }
    return {
      filter: result[filter],
    };
  }

  /**
   * @private
   */
  async filterChecks(filter) {
    let checksToRun = await this.checks;
    if (filter) {
      checksToRun = checksToRun.filter((check) => check.id === filter);
    }
    return checksToRun;
  }

  /**
   * Loads all  checks from the file system
   *
   * @private
   */
  async loadChecks() {
    const jsFileExtension = '.js';
    const checkScripts = (await readdir(CHECK_DIR)).filter((f) => f.endsWith(jsFileExtension));
    return checkScripts.map((script) => {
      return {
        id: script.substring(0, script.length - jsFileExtension.length),
        execute: require(path.join(CHECK_DIR, script)),
      };
    });
  }
}

module.exports = PageExperienceGuide;
