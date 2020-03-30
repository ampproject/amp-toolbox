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

const Signature = require('../lib/Signature');
const PRIVATE_KEY = `
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAz28TyldF6N73GAcoDzJwkn5G1Ar6jGcls98L+Exyq3Yt9Gcq
ZPRkslNjK9/HsgvepLp+Le4LdhJqnmdTsTz9xiDk2tAEXvBWo3kfEXMUY5UVVWzM
3cQNfL4vEpHx3UneHsOeu9qr7L/r6sQdhWbwVKM+8q4oWgx1MjP3ZBeQBuThzAGJ
F25egnOPYGI1aCLU2AXGeFoDUBsWbR/BE02EL06vZ0jdhowocJbUtnu8hnn6lzSp
nRZD7ZmRbCY9MPYwWG++DgCOYYB12xSrAdX2B3+0yYcCyL/44whrJ51eEa1rcnvR
Z3k5ASYxgy8rWyGy1EGOtx3ihMPZoL32ZK4eTwIDAQABAoIBADdCnSATXeFqvKLf
DTH3OvwbvdyxTAvpUqb3baXpH8dDxXxNm4KnhMfo5QuEIxvwg5CYyhKMTutWfqbS
Wf5mhCirDKyqK+/q0Pndw4QPh0f8KGHIiU8u8nTf6YRl8uwDyLOjY38iAxkgC8ZQ
Fpk6Uh4KGzPlZ4SNuw7zvx0gFdNv3VmSKEtvLoXUIAGZ34Jc9oSoADjn0SS1BjrB
SxPckPHz6336fhHvSRBdRn42lZ+P1i0oF56oUsirHGEdLe7yokUny23BH0IjOeT7
TlNnJi19FQmsOV1/guoy4UPnN+ioYzz8PsyoHQ1ZZrPRRfWqN8rXtwGtUY9CZ6fo
DGxXLkECgYEA6QONoQhH/T8lovTlG8k/eZxdts0qfm52WBoKSr9HPgfuFbLGHMLN
e57q3JzF0Kvpusv6nKGAU2aMN5fbQsW9Tn4Y29NyKDn9528OlNCrdGHRfn3cuuNx
Ya3OpHttH49a0PsJ5FjAfbYgZkOC+jdCNYA8YaaXHEqnO5PX2PWi9u8CgYEA4+WJ
XD1RBTV7f5D7yT/skQHvg/JyZVz0zc/UDal4eMM7RtivNdPAZAIRsBzrsVE1iJSp
fgIcjauUPAQovVTLVRPF6t8u+PhrlD13Ty0rtwaKPHjlfTqWn6DxSllOd5u6qu11
tlJ+szT+BZbb1ca/BOaVWBgwvlRyaVFkzD1MTqECgYEAz6KR7v/xHlLJ1+b/zX3M
aTKUM5OpHRaTsDgsGaVO95CbcIxoizJvZowa3tF4WFUIpqKjRDWJo0fLBLL1+A86
fJpSznghzoS2oydMSAGV9tQ/mMbRDVwlKZR2gg1WFPxqQbShgPAxPxQu1NGuAgeB
oSkPJTkMiHJhiO5aNgPU3tMCgYBQLYRbCFOF4qAVbFu5HR1MkwLCSD0I/mA+PH0d
ZV82FXG4ZimWZW5NgRDaBgLB+pE8ARl0dKe5DAF17/ypR7jVsMQz8ttiynuGxu0/
1OOJW+qshdgva7psZMIfZzYdDJPq6Oo9/94FjIJGUyH6nxa7Uah/OtuDStCJzxII
bRR4oQKBgHDm98hlGTGvIIkK3ZU3Tcxjg0OxtlmsDsA2DQqjTxgWrk7+x9sX7sos
kt/entRQs/FwiuXfvzfVc2RnqJ0P0F4zevbR+55rax3nv1fWnUhTm698/lh3Kfpp
C8iytkhnemDhNLoBYVaO1tPRSXkyelek+8s3HeKe86Qvc1tbhNV9
-----END RSA PRIVATE KEY-----
`;

const TEST_EXPECTED =
  'Zgk0Fdq9EyoLK0Fspm4GLNfkpFxQRBgWuJyfj7cyDUGjdm9-OB9dK821aasvrF4lBl4dg8-T' +
  '0tO1AJynH0kAb3TaZNHrrI6ItgarhHO34EtkGH_g-h9VHbpNUO8lCcthK55TaUWTHLPgdSmztEuloOVxpQdauSOSqpShg-' +
  '1OqDXMyeaBqQETeb7rFF0VvyEkysWRkEaee-qrcinaeBEGIrHn5zw0Z3zhh8EBjCdgFBo8vYa3x2FXg5fPWLHLgUfQv1IN' +
  '51wf684vhJDJOP-tuS8I-DKa41gzDsH50V5rRB1f1H3tCN2L4toJ8hWOz1kco5kRDbwATXtGNBnet7q--A';

describe('Signature', () => {
  const signature = new Signature(PRIVATE_KEY);
  describe('generate', () => {
    it('Generates the correct signature', () => {
      const result = signature.generate('test');
      expect(result).toBe(TEST_EXPECTED);
    });
  });
});
