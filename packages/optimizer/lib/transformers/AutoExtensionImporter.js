/**
 * Copyright 2020 The AMP HTML Authors. All Rights Reserved.
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

const {findMetaViewport} = require('../HtmlDomHelper');
const {calculateHost} = require('../RuntimeHostHelper');

const BIND_SHORT_FORM_PREFIX = 'bind';
const AMP_BIND_DATA_ATTRIBUTE_PREFIX = 'data-amp-bind-';

// Some AMP component don't bring their own tag, but enable new attributes on other
// elements. Most are included in the AMP validation rules, but some are not. These
// need to be defined manually here.
const manualAttributeToExtensionMapping = new Map([
  ['mask', 'amp-inputmask'],
  ['lightbox', 'amp-lightbox-gallery'],
]);

/**
 * Extension Auto Importer - this transformer auto imports all missing AMP extensions.
 *
 * The importer analyzes the HTML source code and identifies missing AMP extension imports
 * using multiple strategies:
 *
 * - use validation rules to map used AMP tags to required AMP extensions.
 * - use validation rules to map used AMP attributes to required AMP extensions.
 * - manually specifiy attribute to extension mappings if this information is not available in the
 *   validation rules.
 * - mnullay implement AMP extension detection for a few corner cases.
 *
 * This importer also enables a shortcode `bindtext` instead of `data-amp-bind-text` for specifying
 * AMP bindings when the square bracket notation (`[text]`) is not available. To avoid accidently
 * rewriting non-AMP attributes, the transformer uses the AMP validation rules to only rename bindable
 * attributes as specified in the validation rules.
 *
 * You can disable the auto extension import by passing `{ autoExtensionImport: false }` via the config.
 */
class AutoExtensionImporter {
  constructor(config) {
    this.enabled = config.autoExtensionImport !== false;
    this.log_ = config.log.tag('AutoExtensionImporter');

    // We use the validation rules to infer extension imports. The rules are downloaded once and for
    // efficency, we initially extract all needed rules
    this.initExtensionSpec_(config.validatorRules);
  }

  /**
   * @private
   */
  async initExtensionSpec_(validatorRules) {
    this.extensionSpec = validatorRules.fetch().then((rules) => {
      // Map extension names to more info
      const extensionsMap = new Map(rules.extensions.map((ext) => [ext.name, {
        name: ext.name,
        type: ext.extensionType === 'CUSTOM_TEMPLATE' ? 'custom-template' : 'custom-element',
        version: ext.version.filter((v) => v !== 'latest'),
      }]));
      // Maps tags (e.g. amp-state) to their extension (e.g. amp-bind)
      const tagToExtensionsMapping = new Map();
      // Maps tags to their extension specific allowed attributes
      // (e.g. amp-img => amp-fx => amp-fx-collection)
      const tagToAttributeMapping = new Map();
      // Maps tags to their bindable attributes (e.g. div => text)
      const tagToBindAttributeMapping = new Map();
      // Iterate over all available tags
      for (const tag of rules.tags) {
        const tagName = tag.tagName.toLowerCase();
        // Map amp tags to their required extension(s)
        if (tagName.startsWith('amp-')) {
          tagToExtensionsMapping.set(tagName, tag.requiresExtension);
        }
        // Collects all bindable attributes
        const bindableAttributes = new Set();
        // Process the tag specific attributes
        for (const attribute of tag.attrs) {
          // Hack: fix missing attribute dependencies (e.g. amp-img => lightbox => amp-lightbox-gallery)
          if (manualAttributeToExtensionMapping.has(attribute.name)) {
            attribute.requiresExtension = [manualAttributeToExtensionMapping.get(attribute.name)];
          }
          // Map attributes to tags and extensions (e.g. amp-img => amp-fx => amp-fx-collection)
          if (attribute.requiresExtension && attribute.requiresExtension.length > 0) {
            const attributeMapping = tagToAttributeMapping.get(tagName) || [];
            attributeMapping.push(attribute);
            tagToAttributeMapping.set(tagName, attributeMapping);
          }
          // Maps tags to bindable attributes which are named `[text]`
          if (attribute.name.startsWith('[')) {
            bindableAttributes.add(attribute.name.substring(1, attribute.name.length - 1));
          }
        }
        tagToBindAttributeMapping.set(tagName, bindableAttributes);
      }
      return {
        extensionsMap,
        tagToExtensionsMapping,
        tagToAttributeMapping,
        tagToBindAttributeMapping,
      };
    });
  }

  async transform(tree, params) {
    if (!this.enabled) {
      return;
    }
    const html = tree.root.firstChildByTag('html');
    const head = html.firstChildByTag('head');
    if (!head) return;
    const body = html.firstChildByTag('body');
    if (!body) return;

    // Extensions which need to be imported
    const extensionsToImport = new Set();
    // Keep track of existing extensions imports to avoid duplicates
    const existingImports = new Set();

    // Some AMP components need to be detected in the head (e.g. amp-access)
    this.findExtensionsToImportInHead_(head, extensionsToImport, existingImports);

    // Most AMP components can be detected in the body
    await this.findExtensionsToImportInBody_(body, extensionsToImport);

    if (extensionsToImport.length === 0) {
      // Nothing to do
      return;
    }

    // We use this for adding new import elements to the header
    const referenceNode = findMetaViewport(head);

    // Support custom runtime URLs
    const host = calculateHost(params);
    for (const extensionName of extensionsToImport) {
      if (existingImports.has(extensionName)) {
        continue;
      }
      const extension = (await this.extensionSpec).extensionsMap.get(extensionName.trim());
      this.log_.debug('auto importing', extensionName);
      // Use the latest version by default
      const version = extension.version[extension.version.length - 1];
      const extensionImportAttribs = {
        'async': '',
        'src': `${host.ampUrlPrefix}/v0/${extensionName}-${version}.js`,
      };
      extensionImportAttribs[extension.type] = extensionName;
      const extensionImport = tree.createElement('script', extensionImportAttribs);
      head.insertAfter(extensionImport, referenceNode);
    }
  }

  /**
   * @private
   */
  findExtensionsToImportInHead_(head, extensionsToImport, existingImports) {
    let node = head.firstChild;
    while (node) {
      // Detect any existing extension imports
      const customElement = this.getCustomElement_(node);
      if (customElement) {
        existingImports.add(customElement);
      }
      // Explicitly detect amp-access via the script tag in the header
      if (node.tagName === 'script' && node.attribs['id'] === 'amp-access') {
        extensionsToImport.add('amp-access');
      }
      node = node.nextSibling;
    }
  }

  /**
   * @private
   */
  async findExtensionsToImportInBody_(body, extensionsToImport) {
    const extensionSpec = (await this.extensionSpec);
    let node = body;
    while (node !== null) {
      if (node.tagName) {
        this.addRequiredExtensionByTag_(node, extensionSpec, extensionsToImport);
        this.addRequiredExtensionByAttributes_(node, extensionSpec, extensionsToImport);
      }
      node = node.nextNode();
    }
  }

  /**
   * @private
   */
  addRequiredExtensionByTag_(node, extensionSpec, allRequiredExtensions) {
    // Check for required extensions by tag name
    const requiredExtensions = extensionSpec.tagToExtensionsMapping.get(node.tagName);
    if (requiredExtensions) {
      requiredExtensions.forEach((ext) => allRequiredExtensions.add(ext));
    }
    // Add custom templates (e.g. amp-mustache)
    if (node.tagName === 'template' && node.attribs.type) {
      allRequiredExtensions.add(node.attribs.type);
    }
  }

  /**
   * @private
   */
  addRequiredExtensionByAttributes_(node, extensionSpec, allRequiredExtensions) {
    if (!node.tagName || !node.attribs) {
      return;
    }
    // Look for element attributes indicating AMP components (e.g. amp-fx)
    const tagToAttributeMapping = extensionSpec.tagToAttributeMapping;
    const attributesForTag = tagToAttributeMapping.get(node.tagName) || [];
    attributesForTag.forEach((attribute) => {
      if (node.attribs[attribute.name] !== undefined) {
        attribute.requiresExtension.forEach((ext) => {
          allRequiredExtensions.add(ext);
        });
      }
    });
    // Check for amp-bind attribute bindings
    const tagToBindAttributeMapping = extensionSpec.tagToBindAttributeMapping;
    const attributeNames = Object.keys(node.attribs);
    if (
      attributeNames.some((a) => a.startsWith('[') ||
      a.startsWith(AMP_BIND_DATA_ATTRIBUTE_PREFIX))
    ) {
      allRequiredExtensions.add('amp-bind');
    }
    // Rewrite short-form `bindtext` to `data-amp-bind-text`
    // to avoid false-positives we check for each tag only the
    // supported bindable attributes (e.g. for a div only bindtext, but not bindvalue).
    const ampBindAttrs = tagToBindAttributeMapping.get(node.tagName);
    // true if we need to import amp-bind
    let usesAmpBind = false;
    for (const attributeName of attributeNames) {
      if (!attributeName.startsWith(BIND_SHORT_FORM_PREFIX)) {
        continue;
      }
      const attributeNameWithoutBindPrefix =
        attributeName.substring(BIND_SHORT_FORM_PREFIX.length);

      // Rename attribute from bindx to data-amp-bind-x
      if (ampBindAttrs.has(attributeNameWithoutBindPrefix)) {
        const newAttributeName =
            `${AMP_BIND_DATA_ATTRIBUTE_PREFIX}${attributeNameWithoutBindPrefix}`;
        node.attribs[newAttributeName] = node.attribs[attributeName];
        delete node.attribs[attributeName];
        usesAmpBind = true;
      }
    }
    if (usesAmpBind) {
      allRequiredExtensions.add('amp-bind');
    }
  }

  /**
   * @private
   */
  getCustomElement_(scriptNode) {
    if (scriptNode.tagName !== 'script') {
      return '';
    }
    let customElement = scriptNode.attribs['custom-element'] ||
      scriptNode.attribs['custom-template'] ||
      '';
    if (!customElement) {
      return '';
    }
    customElement = customElement.toLowerCase();
    if (!customElement.startsWith('amp-')) {
      return '';
    }
    return customElement;
  }
}

module.exports = AutoExtensionImporter;
