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

const AmpValidatorRules = require('../lib/AmpValidatorRules');

describe('AmpValidatorRules', () => {
  it('Loads errors', () => {
    const rules = makeRules({
      errorFormats: [
        {
          code: 'TEST',
          format: '%s error',
        },
      ],
      errorSpecificity: [
        {
          code: 'TEST',
          specificity: 1,
        },
      ],
    });
    expect(rules.errors).toEqual({
      TEST: {
        format: '%s error',
        specificity: 1,
      },
    });
  });

  it('Loads extensions', () => {
    const rules = makeRules({
      tags: [
        {
          extensionSpec: {
            name: 'amp-some-component',
            version: ['0.1', 'latest'],
          },
          htmlFormat: ['AMP'],
          tagName: 'SCRIPT',
        },
      ],
    });
    expect(rules.tags).toEqual([]);
    expect(rules.extensions).toEqual([
      {
        name: 'amp-some-component',
        version: ['0.1', 'latest'],
        htmlFormat: ['AMP'],
      },
    ]);
    expect(rules.getExtension('AMP', 'amp-some-component')).toEqual({
      name: 'amp-some-component',
      version: ['0.1', 'latest'],
      htmlFormat: ['AMP'],
    });
    expect(rules.getExtension('AMP4EMAIL', 'amp-some-component')).toEqual(null);
  });

  it('Loads tags', () => {
    const rules = makeRules({
      attrLists: [
        {
          name: '$GLOBAL_ATTRS',
          attrs: [{name: 'global'}],
        },
        {
          name: '$AMP_LAYOUT_ATTRS',
          attrs: [{name: 'layoutattr'}],
        },
        {
          name: 'some-list',
          attrs: [{name: 'test'}],
        },
      ],
      tags: [
        {
          htmlFormat: ['AMP', 'AMP4EMAIL'],
          attrs: [{name: 'align'}],
          attrLists: ['some-list'],
          tagName: 'DIV',
        },
        {
          htmlFormat: ['AMP', 'AMP4EMAIL'],
          attrs: [{name: 'align'}],
          disabledBy: ['transformed'],
          ampLayout: {
            supportedLayouts: ['FIXED', 'FIXED_HEIGHT'],
          },
          tagName: 'AMP-IMG',
        },
      ],
    });

    const tags = [
      {
        htmlFormat: ['AMP', 'AMP4EMAIL'],
        attrs: [
          {name: 'align'},
          {name: 'test'},
          {
            name: 'global',
            global: true,
          },
        ],
        tagName: 'DIV',
      },
      {
        htmlFormat: ['AMP', 'AMP4EMAIL'],
        attrs: [
          {name: 'align'},
          {
            name: 'layoutattr',
            layout: true,
          },
          {
            name: 'global',
            global: true,
          },
        ],
        disabledBy: ['transformed'],
        ampLayout: {
          supportedLayouts: ['FIXED', 'FIXED_HEIGHT'],
        },
        tagName: 'AMP-IMG',
      },
    ];
    expect(rules.tags).toEqual(tags);
    expect(rules.extensions).toEqual([]);
    expect(rules.getTagsForFormat('AMP4EMAIL')).toEqual(tags);
    expect(rules.getTagsForFormat('AMP', true)).toEqual([tags[0]]);
  });
});

function makeRules(rules) {
  return new AmpValidatorRules(
    Object.assign(
      {
        errorFormats: [],
        errorSpecificity: [],
        attrLists: [
          {
            name: '$AMP_LAYOUT_ATTRS',
            attrs: [],
          },
          {
            name: '$GLOBAL_ATTRS',
            attrs: [],
          },
        ],
        tags: [],
      },
      rules
    )
  );
}
