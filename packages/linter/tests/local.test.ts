import { assertPass, runLocalTest, assertWarn, assertFail } from "./lib";
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
