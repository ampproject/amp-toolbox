/**
 * Copyright 2021  The AMP HTML Authors
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

const isHeroImageCandidate = require('../helpers/isHeroImageCandidate');

/**
 * Checks if hero images are present in the initial viewport and declare data-hero
 *
 * @param {Object} pageData
 */
const heroImages = (pageData, result) => {
  const heroImageCandidates = pageData.criticalAmpImg.filter(
    (img) => !img.dataHero && isHeroImageCandidate(img)
  );
  if (heroImageCandidates.length === 0) {
    return;
  }

  result.warn({
    title: 'Improve LCP by optimizing hero images',
    message:
      'Let AMP Caches and Optimizers optimize your hero images by adding the [`data-hero` attribute](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/amp-optimizer-guide/explainer/?format=websites#hero-image-optimization) to images in your first viewport.',
  });
  result.addDetails({
    headings: [{label: 'Affected images', valueType: 'text', key: 'image'}],
    items: heroImageCandidates.map((img) => {
      return {
        image: `\`<amp-img src="${img.src}" layout="${img.layout}" width="${img.width}" height="${img.height}" ...>\``,
      };
    }),
  });
};

module.exports = heroImages;
