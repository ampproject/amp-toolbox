import { cli } from "./cli";
import { LinkRelCanonicalIsOk } from "./rules/LinkRelCanonicalIsOk";
import { AmpVideoIsSmall } from "./rules/AmpVideoIsSmall";
import { AmpVideoIsSpecifiedByAttribute } from "./rules/AmpVideoIsSpecifiedByAttribute";
import { StoryRuntimeIsV1 } from "./rules/StoryRuntimeIsV1";
import { StoryMetadataIsV1 } from "./rules/StoryMetadataIsV1";
import { MetaCharsetIsFirst } from "./rules/MetaCharsetIsFirst";
import { RuntimeIsPreloaded } from "./rules/RuntimeIsPreloaded";
import { StoryIsMostlyText } from "./rules/StoryIsMostlyText";
import { StoryMetadataThumbnailsAreOk } from "./rules/StoryMetadataThumbnailsAreOk";
import { AmpImgHeightWidthIsOk } from "./rules/AmpImgHeightWidthIsOk";
import { AmpImgAmpPixelPreferred } from "./rules/AmpImgAmpPixelPreferred";
import { AmpImgPlaceholderIsDataUri } from "./rules/AmpImgPlaceholderIsDataUri";
import { EndpointsAreAccessibleFromOrigin } from "./rules/EndpointsAreAccessibleFromOrigin";
import { EndpointsAreAccessibleFromCache } from "./rules/EndpointsAreAccessibleFromCache";
import { SxgVaryOnAcceptAct } from "./rules/SxgVaryOnAcceptAct";
import { SxgContentNegotiationIsOk } from "./rules/SxgContentNegotiationIsOk";
import { SxgDumpSignedExchangeVerify } from "./rules/SxgDumpSignedExchangeVerify";
import { SxgAmppkgIsForwarded } from "./rules/SxgAmppkgIsForwarded";
import { MetadataIncludesOGImageSrc } from "./rules/MetadataIncludesOGImageSrc";
import { ImagesHaveAltText } from "./rules/ImagesHaveAltText";
import { VideosHaveAltText } from "./rules/VideosHaveAltText";
import { VideosAreSubtitled } from "./rules/VideosAreSubtitled";
import { IsValid } from "./rules/IsValid";
import { TitleMeetsLengthCriteria } from "./rules/TitleMeetsLengthCriteria";
import { IsTransformedAmp } from "./rules/IsTransformedAmp";
import { ModuleRuntimeUsed } from "./rules/ModuleRuntimeUsed";
import { BlockingExtensionsPreloaded } from "./rules/BlockingExtensionsPreloaded";
import { FontsArePreloaded } from "./rules/FontsArePreloaded";
import { HeroImageIsDefined } from "./rules/HeroImageIsDefined";
import { FastGoogleFontsDisplay } from "./rules/FastGoogleFontsDisplay";
import { NoIconFontIsUsed } from "./rules/NoIconFontIsUsed";
import { GoogleFontPreconnect } from "./rules/GoogleFontPreconnect";
import { BoilerplateIsRemoved } from "./rules/BoilerplateIsRemoved";
import { AmpImgUsesSrcSet } from "./rules/AmpImgUsesSrcSet";
import { ViewportDisablesTapDelay } from "./rules/ViewportDisablesTapDelay";
import { IsUsingLatestComponentVersion } from "./rules/IsUsingLatestComponentVersion";
import { RuleConstructor } from "./rule";
import { isArray } from "util";
import * as cheerio from "cheerio";

export enum LintMode {
  Amp = "amp",
  AmpStory = "ampstory",
  Amp4Ads = "amp4ads",
  Amp4Email = "amp4email",
  PageExperience = "pageexperience",
  Sxg = "sxg",
}

export enum Status {
  PASS = "PASS",
  FAIL = "FAIL",
  WARN = "WARN",
  INFO = "INFO",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

export enum StatusNumber {
  PASS,
  FAIL,
  WARN,
  INFO,
  INTERNAL_ERROR,
}

export interface Result {
  readonly status: Status;
  readonly message?: string;
  readonly url: string;
  readonly title: string;
  readonly info: string;
}

export interface Context {
  readonly url: string;
  readonly $: cheerio.Root;
  readonly raw: { headers: { [key: string]: string }; body: string };
  readonly headers: {
    [key: string]: string;
  };
  readonly mode: LintMode;
}

export interface Metadata {
  "title"?: string;
  "publisher"?: string;
  "publisher-logo-src"?: string;
  "poster-portrait-src"?: string;
  "poster-square-src"?: string;
  "poster-landscape-src"?: string;
}

export function guessMode($: cheerio.Root): LintMode {
  if ($("body amp-story[standalone]").length === 1) {
    return LintMode.AmpStory;
  }
  // TODO Add tests for the other types
  return LintMode.Amp;
}

function testsForMode(type: LintMode) {
  const tests: Map<LintMode, Array<RuleConstructor>> = new Map();
  tests.set(LintMode.Sxg, [
    IsValid,
    SxgAmppkgIsForwarded,
    SxgContentNegotiationIsOk,
    SxgVaryOnAcceptAct,
    SxgDumpSignedExchangeVerify,
  ]);
  tests.set(LintMode.Amp, [
    IsValid,
    AmpVideoIsSmall,
    AmpVideoIsSpecifiedByAttribute,
    MetaCharsetIsFirst,
    RuntimeIsPreloaded,
    AmpImgHeightWidthIsOk,
    AmpImgAmpPixelPreferred,
    EndpointsAreAccessibleFromOrigin,
    EndpointsAreAccessibleFromCache,
    ViewportDisablesTapDelay,
  ]);
  tests.set(
    LintMode.AmpStory,
    (tests.get(LintMode.Amp) || []).concat([
      IsValid,
      LinkRelCanonicalIsOk,
      StoryRuntimeIsV1,
      StoryMetadataIsV1,
      StoryIsMostlyText,
      StoryMetadataThumbnailsAreOk,
      MetadataIncludesOGImageSrc,
      ImagesHaveAltText,
      VideosHaveAltText,
      VideosAreSubtitled,
      TitleMeetsLengthCriteria,
      ViewportDisablesTapDelay,
    ])
  );
  tests.set(
    LintMode.PageExperience,
    (tests.get(LintMode.PageExperience) || []).concat([
      IsValid,
      RuntimeIsPreloaded,
      BlockingExtensionsPreloaded,
      NoIconFontIsUsed,
      GoogleFontPreconnect,
      IsTransformedAmp,
      BoilerplateIsRemoved,
      ModuleRuntimeUsed,
      AmpImgUsesSrcSet,
      AmpImgPlaceholderIsDataUri,
      ViewportDisablesTapDelay,
      IsUsingLatestComponentVersion,
    ])
  );
  return tests.get(type) || [];
}

export async function lint(
  context: Context
): Promise<{ [key: string]: Result | Result[] }> {
  const res = await Promise.all(
    testsForMode(context.mode).map(async (tc) => {
      const t = new tc();
      try {
        const r = await t.run(context);
        if (isArray(r) && r.length === 0) {
          // Hack: if the result of running a test is [], then the test has
          // tested multiple constructs (e.g. images), and found no issues. In
          // this case, there's no meta information available, so we
          // artificially create a "PASS".
          return [
            t.constructor.name,
            [Object.assign({ status: Status.PASS, message: "" }, t.meta())],
          ];
        } else {
          return [t.constructor.name, r];
        }
      } catch (e) {
        return [
          t.constructor.name,
          {
            status: Status.INTERNAL_ERROR,
            message: JSON.stringify(e),
          } as Result,
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
