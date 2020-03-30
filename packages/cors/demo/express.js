/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
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

const express = require('express');
const app = express();
const port = 3000;

const ampCors = require('@ampproject/toolbox-cors');

app.use(
  ampCors({
    verbose: true,
  })
);

app.get('/', (req, res) => {
  /* eslint-disable max-len */
  res.send(`<!doctype html>
<html ⚡> <head>
  <meta charset="utf-8">
  <title>My AMP Page</title>
  <link rel="canonical" href="self.html" />
  <script async custom-element="amp-list" src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>
  <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
 <meta name="viewport" content="width=device-width,minimum-scale=1">
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <script async src="https://cdn.ampproject.org/v0.js"></script>
</head>
<body>
<amp-list height="100" layout="fixed-height" src="/items">
    <template type="amp-mustache" id="amp-template-id">
      {{item}}
    </template>
  </amp-list>
</body>
</html>`);
  /* eslint-enable max-len */
});

app.get('/items', (req, res) => {
  res.json({
    items: [
      {item: 'Item 1'},
      {item: 'Item 2'},
      {item: 'Item 3'},
      {item: 'Item 4'},
      {item: 'Item 5'},
    ],
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
