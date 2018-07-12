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

const MENUS = {
  main: `
    amp-toolbox [command] <options>

    update-cache .............. show weather for today
    version ................... shows version
    help ...................... show this menu`,

  'update-cache': `
    Usage:

    amp-toolbox update-cache [url] <options>


    Options:
    
    --privateKey .............. Path to the private key file. Defaults to './privateKey.pem'.
  `
};

module.exports = (args) => {
  const subCmd = args._[0] === 'help'
    ? args._[1]
    : args._[0]

  console.log(MENUS[subCmd] || MENUS.main)
}
