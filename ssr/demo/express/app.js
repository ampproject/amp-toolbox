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

const express = require('express');
const app = express();

const DEFAULT_PORT = 3000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const port = process.env.PORT || DEFAULT_PORT;
app.listen(port, () => {
  console.log('Example app listening on port 3000!');
});
