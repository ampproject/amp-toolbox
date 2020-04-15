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

const buildOptions = require('minimist-options');
const minimist = require('minimist');
const {log} = require('@ampproject/toolbox-core');

class Cli {
  constructor(logger = log) {
    this.logger_ = logger;
  }

  run(argv) {
    // First pass of minimist is just used to identify command
    const command = minimist(argv)._[0] || 'help';

    // Customize minimist options based on command
    const minimistOptions = {};
    switch (command) {
      case 'download':
        Object.assign(
          minimistOptions,
          buildOptions({
            clear: {
              type: 'boolean',
              default: true,
            },
            rtv: {
              type: 'string',
            },
          })
        );
        break;
      case 'optimize':
        Object.assign(
          minimistOptions,
          buildOptions({
            lts: {
              type: 'boolean',
              default: false,
            },
            rtv: {
              type: 'string',
            },
          })
        );
      case 'runtime-version':
        Object.assign(
          minimistOptions,
          buildOptions({
            canary: {
              type: 'boolean',
              default: false,
            },
            lts: {
              type: 'boolean',
              default: false,
            },
          })
        );
        break;
      default:
        break;
    }

    // Re-run minimist with param option handling
    const args = minimist(argv, minimistOptions);

    // Execute command with arguments
    switch (command) {
      case 'curls':
        return require('./cmds/curls')(args, this.logger_);
      case 'download':
        return require('./cmds/downloadRuntime')(args, this.logger_);
      case 'help':
        return require('./cmds/help')(args, this.logger_);
      case 'lint':
        return require('./cmds/lint')(argv, this.logger_);
      case 'optimize':
        const OptimizeCmd = require('./cmds/optimize.js');
        return new OptimizeCmd().run(args, this.logger_);
      case 'runtime-version':
        return require('./cmds/runtimeVersion')(args, this.logger_);
      case 'update-cache':
        return require('./cmds/updateCache')(args, this.logger_);
      case 'version':
        return require('./cmds/version')(args, this.logger_);
      default:
        return Promise.reject(new Error(`"${command}" is not a valid command!`));
    }
  }
}

module.exports = Cli;
