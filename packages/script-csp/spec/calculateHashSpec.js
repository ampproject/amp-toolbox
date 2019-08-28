/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
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

const {calculateHash} = require('../lib/calculateHash');

describe('calculateHash', () => {
  it('Fails on unsupported hash', () => {
    expect(() => {
      calculateHash('test', {algorithm: 'sha256'});
    }).toThrow();
  });

  it('Correctly calculates hash for string', () => {
    const hash = calculateHash('console.log("Hello")');
    expect(hash).toEqual('sha384-pxL8iiQo8HVAJBSODMzhAu-obo3Zx_F_fxqdHVCp6Cxkv3S_576NIW4hRkemuZOx');
  });

  it('Correctly calculates hash for Buffer', () => {
    const input = Buffer.from('console.log("Hello")');
    const hash = calculateHash(input);
    expect(hash).toEqual('sha384-pxL8iiQo8HVAJBSODMzhAu-obo3Zx_F_fxqdHVCp6Cxkv3S_576NIW4hRkemuZOx');
  });
});
