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
const fs = require('fs');
const path = require('path');
const fileUrl = require('file-url');

const PageExperienceGuide = require('../lib/PageExperienceGuide');
const TEST_DATA_DIR = path.join(__dirname, '../test-data/checks');
let CREATE_SNAPSHOT = process.env.PAGE_EXPERIENCE_SNAPSHOT;

const pageExperienceGuide = new PageExperienceGuide();
let checks;

beforeAll(async () => {
  await pageExperienceGuide.setup();
  checks = pageExperienceGuide.loadChecks();
});

describe('Checks', () => {
  const testDirs = fs.readdirSync(TEST_DATA_DIR);
  for (const testDir of testDirs) {
    const testCaseDir = path.join(TEST_DATA_DIR, testDir);
    const testCases = fs.readdirSync(testCaseDir).filter((file) => file.endsWith('.html'));
    for (const testCase of testCases) {
      test(
        testCase,
        async () => {
          const check = (await checks).find((check) => check.id === testDir);
          if (!check) {
            fail(`no check with name ${testDir}`);
            return;
          }
          const url = fileUrl(path.join(testCaseDir, testCase));
          const result = await pageExperienceGuide.runChecks(url, check.id);
          const resultString = JSON.stringify(result, null, 2);
          const expectedResultPath = path.join(testCaseDir, testCase.replace('.html', '.json'));
          if (CREATE_SNAPSHOT) {
            fs.promises.writeFile(expectedResultPath, resultString, 'utf-8');
          } else {
            let expectedResult;
            try {
              expectedResult = await fs.promises.readFile(expectedResultPath, 'utf-8');
            } catch (e) {
              fail(`No expected results for ${testCase}. Run 'npm run test:snapshot' to generate.`);
            }
            expect(resultString).toEqual(expectedResult);
          }
        },
        20000
      );
    }
  }
});

afterAll(async () => {
  await pageExperienceGuide.teardown();
});
