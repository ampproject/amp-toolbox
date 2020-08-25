import {
  assertPass,
  runLocalTest,
  assertWarn,
  assertFail,
  assertInfo,
} from "./lib";
import { AmpImgAmpPixelPreferred } from "../src/rules/AmpImgAmpPixelPreferred";
import { MetaCharsetIsFirst } from "../src/rules/MetaCharsetIsFirst";
import { RuntimeIsPreloaded } from "../src/rules/RuntimeIsPreloaded";
import { SchemaMetadataIsNews } from "../src/rules/SchemaMetadataIsNews";
import { StoryRuntimeIsV1 } from "../src/rules/StoryRuntimeIsV1";
import { ImagesHaveAltText } from "../src/rules/ImagesHaveAltText";
import { MetadataIncludesOGImageSrc } from "../src/rules/MetadataIncludesOGImageSrc";
import { VideosHaveAltText } from "../src/rules/VideosHaveAltText";
import { VideosAreSubtitled } from "../src/rules/VideosAreSubtitled";
import { BookendExists } from "../src/rules/BookendExists";
import { TitleMeetsLengthCriteria } from "../src/rules/TitleMeetsLengthCriteria";
import { IsTransformedAmp } from "../src/rules/IsTransformedAmp";
import { ModuleRuntimeUsed } from "../src/rules/ModuleRuntimeUsed";
import { BlockingExtensionsPreloaded } from "../src/rules/BlockingExtensionsPreloaded";
import { FontsArePreloaded } from "../src/rules/FontsArePreloaded";
import { HeroImageIsDefined } from "../src/rules/HeroImageIsDefined";
import { FastGoogleFontsDisplay } from "../src/rules/FastGoogleFontsDisplay";
import { GoogleFontPreconnect } from "../src/rules/GoogleFontPreconnect";
import { BoilerplateIsRemoved } from "../src/rules/BoilerplateIsRemoved";

describe(AmpImgAmpPixelPreferred.name, () => {
  it(`${AmpImgAmpPixelPreferred.name} - <amp-img height="1" width="1">`, async () => {
    return assertWarn(
      runLocalTest(
        AmpImgAmpPixelPreferred,
        `${__dirname}/local/AmpImgAmpPixelPreferred-1/source.html`
      )
    );
  });

  it(`${AmpImgAmpPixelPreferred.name} - <amp-img> valid height, width`, async () => {
    return assertPass(
      runLocalTest(
        AmpImgAmpPixelPreferred,
        `${__dirname}/local/AmpImgAmpPixelPreferred-2/source.html`
      )
    );
  });

  it(`${AmpImgAmpPixelPreferred.name} - <amp-img> valid height, width`, async () => {
    return assertPass(
      runLocalTest(
        AmpImgAmpPixelPreferred,
        `${__dirname}/local/AmpImgAmpPixelPreferred-3/source.html`
      )
    );
  });

  it(`${AmpImgAmpPixelPreferred.name} - <amp-img> valid height, width`, async () => {
    return assertPass(
      runLocalTest(
        AmpImgAmpPixelPreferred,
        `${__dirname}/local/AmpImgAmpPixelPreferred-4/source.html`
      )
    );
  });

  it(`${AmpImgAmpPixelPreferred.name} - <amp-img> valid height, width`, async () => {
    return assertPass(
      runLocalTest(
        AmpImgAmpPixelPreferred,
        `${__dirname}/local/AmpImgAmpPixelPreferred-5/source.html`
      )
    );
  });
});

describe(BoilerplateIsRemoved.name, () => {
  it(`${BoilerplateIsRemoved.name} - boilerplate removed`, async () => {
    return assertPass(
      runLocalTest(
        BoilerplateIsRemoved,
        `${__dirname}/local/BoilerplateIsRemoved-1/source.html`
      )
    );
  });

  it(`${BoilerplateIsRemoved.name} - amp-story boilerplate cannot be removed`, async () => {
    return assertPass(
      runLocalTest(
        BoilerplateIsRemoved,
        `${__dirname}/local/BoilerplateIsRemoved-2/source.html`
      )
    );
  });

  it(`${BoilerplateIsRemoved.name} - amp-experiment boilerplate avoidable`, async () => {
    return assertInfo(
      runLocalTest(
        BoilerplateIsRemoved,
        `${__dirname}/local/BoilerplateIsRemoved-3/source.html`
      )
    );
  });

  it(`${BoilerplateIsRemoved.name} - boilerplate was not removed`, async () => {
    return assertWarn(
      runLocalTest(
        BoilerplateIsRemoved,
        `${__dirname}/local/BoilerplateIsRemoved-4/source.html`
      )
    );
  });

  it(`${BoilerplateIsRemoved.name} - not transformed amp`, async () => {
    return assertPass(
      runLocalTest(
        BoilerplateIsRemoved,
        `${__dirname}/local/BoilerplateIsRemoved-5/source.html`
      )
    );
  });
});

describe(BlockingExtensionsPreloaded.name, () => {
  it(`${BlockingExtensionsPreloaded.name} - preload for js and mjs present`, async () => {
    return assertPass(
      runLocalTest(
        BlockingExtensionsPreloaded,
        `${__dirname}/local/BlockingExtensionsPreloaded-1/source.html`
      )
    );
  });

  it(`${BlockingExtensionsPreloaded.name} - No blocking extensions present`, async () => {
    return assertPass(
      runLocalTest(
        BlockingExtensionsPreloaded,
        `${__dirname}/local/BlockingExtensionsPreloaded-2/source.html`
      )
    );
  });

  it(`${BlockingExtensionsPreloaded.name} - preload for js and mjs is missing`, async () => {
    const results = await runLocalTest(
      BlockingExtensionsPreloaded,
      `${__dirname}/local/BlockingExtensionsPreloaded-3/source.html`
    );
    expect(results).toHaveLength(3);
    await assertWarn(results[0]);
    await assertWarn(results[1]);
    await assertWarn(results[2]);
  });
});

describe(FastGoogleFontsDisplay.name, () => {
  it(`${FastGoogleFontsDisplay.name} - all fonts have display param`, async () => {
    return assertPass(
      runLocalTest(
        FastGoogleFontsDisplay,
        `${__dirname}/local/FastGoogleFontsDisplay-1/source.html`
      )
    );
  });
  it(`${FastGoogleFontsDisplay.name} - no or wrong display param`, async () => {
    const results = await runLocalTest(
      FastGoogleFontsDisplay,
      `${__dirname}/local/FastGoogleFontsDisplay-2/source.html`
    );
    expect(results).toHaveLength(4);
    await assertWarn(results[0]);
    await assertWarn(results[1]);
    await assertWarn(results[2]);
    await assertWarn(results[3]);
  });
});

describe(FontsArePreloaded.name, () => {
  it(`${FontsArePreloaded.name} - preload for font exists`, async () => {
    return assertPass(
      runLocalTest(
        FontsArePreloaded,
        `${__dirname}/local/FontsArePreloaded-1/source.html`
      )
    );
  });
  it(`${FontsArePreloaded.name} - preload for font missing`, async () => {
    return assertInfo(
      runLocalTest(
        FontsArePreloaded,
        `${__dirname}/local/FontsArePreloaded-2/source.html`
      )
    );
  });
  it(`${FontsArePreloaded.name} - all fonts have font-display set`, async () => {
    return assertPass(
      runLocalTest(
        FontsArePreloaded,
        `${__dirname}/local/FontsArePreloaded-3/source.html`
      )
    );
  });
});

describe(GoogleFontPreconnect.name, () => {
  it(`${GoogleFontPreconnect.name} - dns-prefetch preconnect exists`, async () => {
    return assertPass(
      runLocalTest(
        GoogleFontPreconnect,
        `${__dirname}/local/GoogleFontPreconnect-1/source.html`
      )
    );
  });
  it(`${GoogleFontPreconnect.name} - preconnect missing`, async () => {
    return assertWarn(
      runLocalTest(
        GoogleFontPreconnect,
        `${__dirname}/local/GoogleFontPreconnect-2/source.html`
      )
    );
  });
  it(`${GoogleFontPreconnect.name} - dns-prefetch missing`, async () => {
    return assertWarn(
      runLocalTest(
        GoogleFontPreconnect,
        `${__dirname}/local/GoogleFontPreconnect-3/source.html`
      )
    );
  });
});

describe(HeroImageIsDefined.name, () => {
  it(`${HeroImageIsDefined.name} - data-hero exists`, async () => {
    return assertPass(
      runLocalTest(
        HeroImageIsDefined,
        `${__dirname}/local/HeroImageIsDefined-1/source.html`
      )
    );
  });
  it(`${HeroImageIsDefined.name} - no relevant hero images`, async () => {
    return assertPass(
      runLocalTest(
        HeroImageIsDefined,
        `${__dirname}/local/HeroImageIsDefined-2/source.html`
      )
    );
  });
  it(`${HeroImageIsDefined.name} - data-hero missing`, async () => {
    return assertWarn(
      runLocalTest(
        HeroImageIsDefined,
        `${__dirname}/local/HeroImageIsDefined-3/source.html`
      )
    );
  });
});

describe(IsTransformedAmp.name, () => {
  it(`${IsTransformedAmp.name} - Transformed AMP detected`, async () => {
    return assertPass(
      runLocalTest(
        IsTransformedAmp,
        `${__dirname}/local/IsTransformedAmp-1/source.html`
      )
    );
  });

  it(`${IsTransformedAmp.name} - No transformed AMP detected`, async () => {
    return assertWarn(
      runLocalTest(
        IsTransformedAmp,
        `${__dirname}/local/IsTransformedAmp-2/source.html`
      )
    );
  });
});

describe(MetaCharsetIsFirst.name, () => {
  it(`${MetaCharsetIsFirst.name} - <meta charset> is first`, async () => {
    return assertPass(
      runLocalTest(
        MetaCharsetIsFirst,
        `${__dirname}/local/MetaCharsetIsFirst-1/source.html`
      )
    );
  });

  it(`${MetaCharsetIsFirst.name} - <meta charset> missing`, async () => {
    return assertFail(
      runLocalTest(
        MetaCharsetIsFirst,
        `${__dirname}/local/MetaCharsetIsFirst-2/source.html`
      )
    );
  });
});

describe(ModuleRuntimeUsed.name, () => {
  it(`${ModuleRuntimeUsed.name} - Module runtime script found`, async () => {
    return assertPass(
      runLocalTest(
        ModuleRuntimeUsed,
        `${__dirname}/local/ModuleRuntimeUsed-1/source.html`
      )
    );
  });

  it(`${ModuleRuntimeUsed.name} - Module runtime script not found`, async () => {
    return assertWarn(
      runLocalTest(
        ModuleRuntimeUsed,
        `${__dirname}/local/ModuleRuntimeUsed-2/source.html`
      )
    );
  });
});

describe(RuntimeIsPreloaded.name, () => {
  it(`${RuntimeIsPreloaded.name} - <link rel="preload"> is absent`, async () => {
    return assertWarn(
      runLocalTest(
        RuntimeIsPreloaded,
        `${__dirname}/local/RuntimeIsPreloaded-1/source.html`
      )
    );
  });

  it(`${RuntimeIsPreloaded.name} - <link rel="preload"> is present`, async () => {
    return assertPass(
      runLocalTest(
        RuntimeIsPreloaded,
        `${__dirname}/local/RuntimeIsPreloaded-2/source.html`
      )
    );
  });

  it(`${RuntimeIsPreloaded.name} - <link rel="modulepreload"> is present`, async () => {
    return assertPass(
      runLocalTest(
        RuntimeIsPreloaded,
        `${__dirname}/local/RuntimeIsPreloaded-3/source.html`
      )
    );
  });
});

describe(SchemaMetadataIsNews.name, () => {
  it(`${SchemaMetadataIsNews.name} - schema type is NewsArticle`, async () => {
    return assertPass(
      runLocalTest(
        SchemaMetadataIsNews,
        `${__dirname}/local/SchemaMetadataIsNews-1/source.html`
      )
    );
  });

  it(`${SchemaMetadataIsNews.name} - schema type is not NewsArticle`, async () => {
    return assertWarn(
      runLocalTest(
        SchemaMetadataIsNews,
        `${__dirname}/local/SchemaMetadataIsNews-2/source.html`
      )
    );
  });
});

describe(StoryRuntimeIsV1.name, () => {
  it(`${StoryRuntimeIsV1.name} - runtime is v1`, async () => {
    return assertPass(
      runLocalTest(
        StoryRuntimeIsV1,
        `${__dirname}/local/StoryRuntimeIsV1-1/source.html`
      )
    );
  });

  it(`${StoryRuntimeIsV1.name} - runtime is not v1`, async () => {
    return assertFail(
      runLocalTest(
        StoryRuntimeIsV1,
        `${__dirname}/local/StoryRuntimeIsV1-2/source.html`
      )
    );
  });
});

describe(BookendExists.name, () => {
  it(`${BookendExists.name} - external bookend data`, async () => {
    return assertPass(
      runLocalTest(
        BookendExists,
        `${__dirname}/local/BookendExists-1/source.html`
      )
    );
  });

  it(`${BookendExists.name} - inline bookend data`, async () => {
    return assertPass(
      runLocalTest(
        BookendExists,
        `${__dirname}/local/BookendExists-2/source.html`
      )
    );
  });

  it(`${BookendExists.name} - no bookend`, async () => {
    return assertWarn(
      runLocalTest(
        BookendExists,
        `${__dirname}/local/BookendExists-3/source.html`
      )
    );
  });
});

describe(MetadataIncludesOGImageSrc.name, () => {
  it(`${MetadataIncludesOGImageSrc.name} - <meta property="og:image"> is present`, async () => {
    return assertPass(
      runLocalTest(
        MetadataIncludesOGImageSrc,
        `${__dirname}/local/MetadataIncludesOGImageSrc-1/source.html`
      )
    );
  });

  it(`${MetadataIncludesOGImageSrc.name} - <meta property="og:image"> is present`, async () => {
    return assertPass(
      runLocalTest(
        MetadataIncludesOGImageSrc,
        `${__dirname}/local/MetadataIncludesOGImageSrc-3/source.html`
      )
    );
  });

  it(`${MetadataIncludesOGImageSrc.name} - <meta property="og:image"> is missing`, async () => {
    return assertWarn(
      runLocalTest(
        MetadataIncludesOGImageSrc,
        `${__dirname}/local/MetadataIncludesOGImageSrc-2/source.html`
      )
    );
  });
});

describe(ImagesHaveAltText.name, () => {
  it(`${ImagesHaveAltText.name} - All <amp-img> have alt text`, async () => {
    return assertPass(
      runLocalTest(
        ImagesHaveAltText,
        `${__dirname}/local/ImagesHaveAltText-1/source.html`
      )
    );
  });

  it(`${ImagesHaveAltText.name} - At least one <amp-img> is missing alt text`, async () => {
    return assertWarn(
      runLocalTest(
        ImagesHaveAltText,
        `${__dirname}/local/ImagesHaveAltText-2/source.html`
      )
    );
  });
});

describe(VideosHaveAltText.name, () => {
  it(`${VideosHaveAltText.name} - All <amp-video> have alt text`, async () => {
    return assertPass(
      runLocalTest(
        VideosHaveAltText,
        `${__dirname}/local/VideosHaveAltText-1/source.html`
      )
    );
  });

  it(`${VideosHaveAltText.name} - At least one <amp-video> is missing alt text`, async () => {
    return assertWarn(
      runLocalTest(
        VideosHaveAltText,
        `${__dirname}/local/VideosHaveAltText-2/source.html`
      )
    );
  });
});

describe(VideosAreSubtitled.name, () => {
  it(`${VideosAreSubtitled.name} - All <amp-video> have subtitles`, async () => {
    return assertPass(
      runLocalTest(
        VideosAreSubtitled,
        `${__dirname}/local/VideosAreSubtitled-1/source.html`
      )
    );
  });

  it(`${VideosAreSubtitled.name} - One or more <amp-video> are missing subtitles`, async () => {
    return assertWarn(
      runLocalTest(
        VideosAreSubtitled,
        `${__dirname}/local/VideosAreSubtitled-2/source.html`
      )
    );
  });
});

describe(TitleMeetsLengthCriteria.name, () => {
  it(`${TitleMeetsLengthCriteria.name} - Title is 40 characters or less`, async () => {
    return assertPass(
      runLocalTest(
        TitleMeetsLengthCriteria,
        `${__dirname}/local/TitleMeetsLengthCriteria-1/source.html`
      )
    );
  });

  it(`${TitleMeetsLengthCriteria.name} - Title is longer than 40 characters`, async () => {
    return assertWarn(
      runLocalTest(
        TitleMeetsLengthCriteria,
        `${__dirname}/local/TitleMeetsLengthCriteria-2/source.html`
      )
    );
  });
});
