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
const fileUrl = require('file-url');
const path = require('path');
const PageExperienceGuide = require('./PageExperienceGuide');

test('runs amp linter checks', async () => {
  const url = fileUrl(path.join(__dirname, '../test-data/pages/hello-world.html'));
  const result = await new PageExperienceGuide().analyze(url);
  console.log(result);
  expect(result['isvalid'].status).toBe('PASS');
});
