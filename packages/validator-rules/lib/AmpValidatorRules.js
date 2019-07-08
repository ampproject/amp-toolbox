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

class AmpValidatorRules {
  constructor(rules) {
    this.initRules_(rules);
  }

  getTagsForFormat(format, transformed) {
    format = format.toLowerCase();
    return this.tags
        .filter(
            (tag) =>
              tag.htmlFormat.includes(format.toUpperCase()) &&
          this.checkEntityFormat_(tag, format) &&
          this.checkEntityTransformed_(tag, transformed)
        )
        .map((tag) => {
          tag = Object.assign({}, tag);
          tag.attrs = tag.attrs.filter(
              (attr) =>
                this.checkEntityFormat_(attr, format) &&
            this.checkEntityTransformed_(attr, transformed)
          );
          return tag;
        });
  }

  getExtensionsForFormat(format) {
    format = format.toUpperCase();
    return this.extensions
        .filter((extension) => extension.htmlFormat.includes(format))
        .reduce((result, extension) => {
          result[extension.name] = Object.assign({}, extension);
          delete result[extension.name].name;
          return result;
        }, {});
  }

  checkEntityTransformed_(entity, transformed) {
    if (transformed) {
      return this.checkEntityFormat_(entity, 'transformed');
    }
    if (entity.enabledBy && entity.enabledBy.includes('transformed')) {
      return false;
    }
    if (entity.disabledBy && !entity.disabledBy.includes('transformed')) {
      return false;
    }
    return true;
  }

  checkEntityFormat_(entity, format) {
    format = format.toLowerCase();
    if (entity.enabledBy && !entity.enabledBy.includes(format)) {
      return false;
    }
    if (entity.disabledBy && entity.disabledBy.includes(format)) {
      return false;
    }
    return true;
  }

  initRules_(rules) {
    this.initErrors_(rules);
    this.initAttrLists_(rules);
    this.initTags_(rules);
    this.initExtensions_(rules);
  }

  initErrors_(rules) {
    this.errors = {};
    for (const errorFormat of rules.errorFormats) {
      const error = this.errors[errorFormat.code] || {};
      error.format = errorFormat.format;
      this.errors[errorFormat.code] = error;
    }
    for (const errorSpecificity of rules.errorSpecificity) {
      const error = this.errors[errorSpecificity.code] || {};
      error.specificity = errorSpecificity.specificity;
      this.errors[errorSpecificity.code] = error;
    }
  }

  initAttrLists_(rules) {
    this.attrLists = {};
    this.specialAttrLists = {};
    for (const {name, attrs} of rules.attrLists) {
      if (name.startsWith('$')) {
        this.specialAttrLists[name] = attrs;
      } else {
        this.attrLists[name] = attrs;
      }
    }
    this.specialAttrLists.$AMP_LAYOUT_ATTRS.forEach(
        (attr) => (attr.layout = true)
    );
    this.specialAttrLists.$GLOBAL_ATTRS.forEach((attr) => (attr.global = true));
  }

  initTags_(rules) {
    this.tags = rules.tags
        .filter((tag) => !tag.extensionSpec)
        .map((tag) => {
          tag.attrs = tag.attrs || [];
          if (tag.attrLists) {
            for (const attrList of tag.attrLists) {
              tag.attrs.push(...this.attrLists[attrList]);
            }
            delete tag.attrLists;
          }
          if (tag.ampLayout) {
            tag.attrs.push(...this.specialAttrLists.$AMP_LAYOUT_ATTRS);
          }
          tag.attrs.push(...this.specialAttrLists.$GLOBAL_ATTRS);

          return tag;
        });
  }

  initExtensions_(rules) {
    this.extensions = rules.tags
        .filter((tag) => tag.extensionSpec)
        .map((tag) =>
          Object.assign({}, tag.extensionSpec, {htmlFormat: tag.htmlFormat})
        );
  }
}

module.exports = AmpValidatorRules;
