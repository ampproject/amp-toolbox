import { cli } from "./cli";
import { SchemaMetadataIsNews } from "./rules/SchemaMetadataIsNews";
import { LinkRelCanonicalIsOk } from "./rules/LinkRelCanonicalIsOk";
import { AmpVideoIsSmall } from "./rules/AmpVideoIsSmall";
import { BookendExists } from "./rules/BookendExists";
import { AmpVideoIsSpecifiedByAttribute } from "./rules/AmpVideoIsSpecifiedByAttribute";
import { StoryRuntimeIsV1 } from "./rules/StoryRuntimeIsV1";
import { StoryMetadataIsV1 } from "./rules/StoryMetadataIsV1";
import { MetaCharsetIsFirst } from "./rules/MetaCharsetIsFirst";
import { RuntimeIsPreloaded } from "./rules/RuntimeIsPreloaded";
import { StoryIsMostlyText } from "./rules/StoryIsMostlyText";
import { StoryMetadataThumbnailsAreOk } from "./rules/StoryMetadataThumbnailsAreOk";
import { AmpImgHeightWidthIsOk } from "./rules/AmpImgHeightWidthIsOk";
import { AmpImgAmpPixelPreferred } from "./rules/AmpImgAmpPixelPreferred";
import { EndpointsAreAccessibleFromOrigin } from "./rules/EndpointsAreAccessibleFromOrigin";
import { EndpointsAreAccessibleFromCache } from "./rules/EndpointsAreAccessibleFromCache";
import { SxgVaryOnAcceptAct } from "./rules/SxgVaryOnAcceptAct";
import { SxgContentNegotiationIsOk } from "./rules/SxgContentNegotiationIsOk";
import { SxgDumpSignedExchangeVerify } from "./rules/SxgDumpSignedExchangeVerify";
import { SxgAmppkgIsForwarded } from "./rules/SxgAmppkgIsForwarded";
import { RuleConstructor } from "./rule";

export enum LintMode {
  Amp = "amp",
  AmpStory = "ampstory",
  Amp4Ads = "amp4ads",
  Amp4Email = "amp4email",
  Sxg = "sxg"
}

export enum Status {
  PASS = "PASS",
  FAIL = "FAIL",
  WARN = "WARN",
  INFO = "INFO",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

export interface Result {
  readonly status: Status;
  readonly message?: string;
}

export interface Context {
  readonly url: string;
  readonly $: CheerioStatic;
  readonly raw: { headers: { [key: string]: string }; body: string };
  readonly headers: {
    [key: string]: string;
  };
  readonly mode: LintMode;
}

export interface Metadata {
  title: string;
  publisher: string;
  "publisher-logo-src": string;
  "poster-portrait-src": string;
  "poster-square-src"?: string;
  "poster-landscape-src"?: string;
}

export function guessMode($: CheerioStatic): LintMode {
  if ($("body amp-story[standalone]").length === 1) {
    return LintMode.AmpStory;
  }
  // TODO Add tests for the other types
  return LintMode.Amp;
}

function testsForMode(type: LintMode) {
  const tests: Map<LintMode, Array<RuleConstructor>> = new Map();
  tests.set(LintMode.Sxg, [
    SxgAmppkgIsForwarded,
    SxgContentNegotiationIsOk,
    SxgVaryOnAcceptAct,
    SxgDumpSignedExchangeVerify
  ]);
  tests.set(LintMode.Amp, [
    LinkRelCanonicalIsOk,
    AmpVideoIsSmall,
    AmpVideoIsSpecifiedByAttribute,
    MetaCharsetIsFirst,
    RuntimeIsPreloaded,
    AmpImgHeightWidthIsOk,
    AmpImgAmpPixelPreferred,
    EndpointsAreAccessibleFromOrigin,
    EndpointsAreAccessibleFromCache
  ]);
  tests.set(
    LintMode.AmpStory,
    (tests.get(LintMode.Amp) || []).concat([
      BookendExists,
      SchemaMetadataIsNews,
      StoryRuntimeIsV1,
      StoryMetadataIsV1,
      StoryIsMostlyText,
      StoryMetadataThumbnailsAreOk
    ])
  );
  return tests.get(type) || [];
}

export async function lint(
  context: Context
): Promise<{ [key: string]: Result | Result[] }> {
  const res = await Promise.all(
    testsForMode(context.mode).map(async tc => {
      const t = new tc();
      try {
        const r = await t.run(context);
        return [t.constructor.name, r];
      } catch (e) {
        return [
          t.constructor.name,
          {
            status: Status.INTERNAL_ERROR,
            message: JSON.stringify(e)
          } as Result
        ];
      }
    })
  );
  return res.reduce(
    (
      a: { [key: string]: Result | Result[] },
      kv: [string, Result | Result[]]
    ) => {
      a[kv[0].toLowerCase()] = kv[1];
      return a;
    },
    {}
  );
}

export { cli };
