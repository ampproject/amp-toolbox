import { readFileSync } from "fs";
import { restore as nockRestore } from "nock";
jest.mock("../src/caches");
import {
  withFixture,
  assertMatch,
  runNetworkTest,
  assertPass,
  assertFail,
  assertFnList,
} from "./lib";
import { StoryMetadataThumbnailsAreOk } from "../src/rules/StoryMetadataThumbnailsAreOk";
import { Result, Status } from "../src";
import { LinkRelCanonicalIsOk } from "../src/rules/LinkRelCanonicalIsOk";
import { AmpVideoIsSmall } from "../src/rules/AmpVideoIsSmall";
import { StoryMetadataIsV1 } from "../src/rules/StoryMetadataIsV1";
import { AmpImgHeightWidthIsOk } from "../src/rules/AmpImgHeightWidthIsOk";
import { EndpointsAreAccessibleFromOrigin } from "../src/rules/EndpointsAreAccessibleFromOrigin";
import { EndpointsAreAccessibleFromCache } from "../src/rules/EndpointsAreAccessibleFromCache";
import { SxgVaryOnAcceptAct } from "../src/rules/SxgVaryOnAcceptAct";
import { SxgContentNegotiationIsOk } from "../src/rules/SxgContentNegotiationIsOk";
import { SxgAmppkgIsForwarded } from "../src/rules/SxgAmppkgIsForwarded";
import { IsValid } from "../src/rules/IsValid";
import { caches } from "../src/caches";

beforeAll(() => {
  (caches as jest.Mock).mockReturnValue(
    Promise.resolve(
      JSON.parse(readFileSync(`${__dirname}/caches.json`).toString()).caches
    )
  );
});

afterEach(() => {
  nockRestore();
});

afterAll(() => {
  (caches as jest.Mock).mockRestore();
});

describe(StoryMetadataThumbnailsAreOk.name, () => {
  it(`${StoryMetadataThumbnailsAreOk.name} - poster-portrait-src is too small`, () => {
    return withFixture("thumbnails1", () =>
      assertFnList(
        runNetworkTest(
          StoryMetadataThumbnailsAreOk,
          "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
        ),
        (actual: Result[]) => {
          let fails = 0;
          actual.forEach((result) => {
            if (result.status === Status.FAIL) {
              fails++;
            }
          });

          return fails === 1
            ? ""
            : `expected one error, got ${JSON.stringify(actual)}`;
        }
      )
    );
  });

  it(`${StoryMetadataThumbnailsAreOk.name} - publisher-logo-src missing`, () => {
    return withFixture("thumbnails2", () =>
      assertMatch(
        runNetworkTest(
          StoryMetadataThumbnailsAreOk,
          "https://regular-biology.glitch.me/"
        ),
        "publisher-logo-src"
      )
    );
  });

  it(`${StoryMetadataThumbnailsAreOk.name} - poster-portrait-src not found`, () => {
    return withFixture("thumbnails3", () =>
      assertMatch(
        runNetworkTest(StoryMetadataThumbnailsAreOk, "http://localhost:5000/"),
        "file not found"
      )
    );
  });

  it(`${StoryMetadataThumbnailsAreOk.name} - publisher-logo-src is webp`, () => {
    return withFixture("thumbnails4", () =>
      assertFnList(
        runNetworkTest(
          StoryMetadataThumbnailsAreOk,
          "https://fantastic-lemon-asterisk.glitch.me/"
        ),
        (actual: Result[]) => {
          let fails = 0;
          actual.forEach((result) => {
            if (result.status === Status.FAIL) {
              fails++;
            }
          });

          return fails === 0
            ? ""
            : `expected no errors, got ${JSON.stringify(actual)}`;
        }
      )
    );
  });

  it(`${StoryMetadataThumbnailsAreOk.name} - poster-portrait-src is correct size`, () => {
    return withFixture("thumbnails5", () =>
      assertFnList(
        runNetworkTest(
          StoryMetadataThumbnailsAreOk,
          "https://fantastic-lemon-asterisk.glitch.me/"
        ),
        (actual: Result[]) => {
          let fails = 0;
          actual.forEach((result) => {
            if (result.status === Status.FAIL) {
              fails++;
            }
          });

          return fails === 0
            ? ""
            : `expected no errors, got ${JSON.stringify(actual)}`;
        }
      )
    );
  });
});

describe(IsValid.name, () => {
  it(`${IsValid.name} - valid`, () => {
    return withFixture("testvalidity1", () =>
      assertPass(runNetworkTest(IsValid, "https://www.ampproject.org/"))
    );
  });

  it(`${IsValid.name} - not valid`, () => {
    return withFixture("testvalidity2", async () =>
      assertFail(
        runNetworkTest(IsValid, "https://precious-sturgeon.glitch.me/")
      )
    );
  });

  it(`${IsValid.name} - valid with svg`, () => {
    return withFixture("testvalidity3", () =>
      assertPass(runNetworkTest(IsValid, "https://amp.dev/index.amp.html"))
    );
  });
});

describe(LinkRelCanonicalIsOk.name, () => {
  it(`${LinkRelCanonicalIsOk.name} - canonical`, () => {
    return withFixture("testcanonical1", () =>
      assertPass(
        runNetworkTest(
          LinkRelCanonicalIsOk,
          "https://regular-biology.glitch.me/"
        )
      )
    );
  });

  it(`${LinkRelCanonicalIsOk.name} - not canonical`, () => {
    return withFixture("testcanonical2", () =>
      assertFail(
        runNetworkTest(
          LinkRelCanonicalIsOk,
          "https://copper-cupboard.glitch.me/"
        )
      )
    );
  });

  it(`${LinkRelCanonicalIsOk.name} - relative`, () => {
    return withFixture("testcanonical3", () =>
      assertPass(
        runNetworkTest(
          LinkRelCanonicalIsOk,
          "https://regular-biology.glitch.me/"
        )
      )
    );
  });

  it(`${LinkRelCanonicalIsOk.name} - not AMP Story`, () => {
    return withFixture("testcanonical4", () =>
      assertPass(
        runNetworkTest(
          LinkRelCanonicalIsOk,
          "https://bejewled-tachometer.glitch.me/"
        )
      )
    );
  });
});

describe(AmpVideoIsSmall.name, () => {
  it(`${AmpVideoIsSmall.name} - too big`, () => {
    return withFixture("testvideosize1", () =>
      assertFail(
        runNetworkTest(AmpVideoIsSmall, "https://regular-biology.glitch.me/")
      )
    );
  });

  it(`${AmpVideoIsSmall.name} - good size #1`, () => {
    return withFixture("testvideosize2", () =>
      assertPass(
        runNetworkTest(AmpVideoIsSmall, "https://regular-biology.glitch.me/")
      )
    );
  });

  it(`${AmpVideoIsSmall.name} - good size #2`, () => {
    return withFixture("testvideosize3", () =>
      assertPass(
        runNetworkTest(
          AmpVideoIsSmall,
          "https://ampbyexample.com/stories/features/media/preview/embed/"
        )
      )
    );
  });
});

describe(EndpointsAreAccessibleFromOrigin.name, () => {
  it(`${EndpointsAreAccessibleFromOrigin.name} - configured correctly`, () => {
    return withFixture("bookendsameorigin1", () =>
      assertPass(
        runNetworkTest(
          EndpointsAreAccessibleFromOrigin,
          "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
        )
      )
    );
  });

  it(`${EndpointsAreAccessibleFromOrigin.name} - bookend not application/json`, () => {
    return withFixture("bookendsameorigin2", () =>
      assertMatch(
        runNetworkTest(
          EndpointsAreAccessibleFromOrigin,
          "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
        ),
        "application/json"
      )
    );
  });

  it(`${EndpointsAreAccessibleFromOrigin.name} - bookend not JSON`, () => {
    return withFixture("bookendsameorigin3", () =>
      assertMatch(
        runNetworkTest(
          EndpointsAreAccessibleFromOrigin,
          "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
        ),
        "JSON"
      )
    );
  });

  it(`${EndpointsAreAccessibleFromOrigin.name} - v0 AMP Story - configured correctly`, () => {
    return withFixture("bookendsameorgin4", () =>
      assertPass(
        runNetworkTest(
          EndpointsAreAccessibleFromOrigin,
          "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
        )
      )
    );
  });
});

describe(EndpointsAreAccessibleFromCache.name, () => {
  it(`${EndpointsAreAccessibleFromCache.name} - configured correctly`, () => {
    return withFixture("bookendcache1", () =>
      assertPass(
        runNetworkTest(
          EndpointsAreAccessibleFromCache,
          "https://preview.amp.dev/documentation/examples/introduction/stories_in_amp/"
        )
      )
    );
  });

  it(`${EndpointsAreAccessibleFromCache.name} - incorrect headers`, () => {
    return withFixture("bookendcache2", () =>
      assertMatch(
        runNetworkTest(
          EndpointsAreAccessibleFromCache,
          "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
        ),
        "access-control-allow-origin"
      )
    );
  });
});

describe(StoryMetadataIsV1.name, () => {
  it(`${StoryMetadataIsV1.name} - valid metadata`, () => {
    return withFixture("ampstoryv1metadata1", () =>
      assertPass(
        runNetworkTest(
          StoryMetadataIsV1,
          "https://ithinkihaveacat.github.io/hello-world-amp-story/"
        )
      )
    );
  });

  it(`${StoryMetadataIsV1.name} - invalid metadata`, () => {
    return withFixture("ampstoryv1metadata2", () =>
      assertMatch(
        runNetworkTest(
          StoryMetadataIsV1,
          "https://ithinkihaveacat-hello-world-amp-story-7.glitch.me/"
        ),
        "publisher-logo-src"
      )
    );
  });
});

describe(AmpImgHeightWidthIsOk.name, () => {
  it(`${AmpImgHeightWidthIsOk.name} - height/width are incorrect #1`, () => {
    return withFixture("ampimg1", () =>
      assertFnList(
        runNetworkTest(
          AmpImgHeightWidthIsOk,
          "https://ampbyexample.com/components/amp-img/"
        ),
        (res) => {
          if (res.length !== 3) {
            return "expected 3 failures";
          }
          const message = res[1].message;
          if (typeof message !== "string" || !message.match("does-not-exist")) {
            return "does-not-exist.jpg should be a 404";
          }
          return "";
        }
      )
    );
  });

  it(`${AmpImgHeightWidthIsOk.name} - height/width are incorrect #2`, () => {
    return withFixture("ampimg2", () =>
      assertFnList(
        runNetworkTest(
          AmpImgHeightWidthIsOk,
          "https://www.ampproject.org/docs/reference/components/amp-story"
        ),
        (res) => {
          if (res.length !== 6) {
            return "expected 6 failures";
          }
          const message1 = res[0].message;
          if (
            typeof message1 !== "string" ||
            !message1.match("amp-story-tag-hierarchy")
          ) {
            return "amp-story-tag-hierarchy.png is wrong ratio";
          }
          const message2 = res[5].message;
          if (
            typeof message2 !== "string" ||
            !message2.match("layers-layer-3")
          ) {
            return "layers-layer-3.jpg is too big";
          }
          return "";
        }
      )
    );
  });

  it(`${AmpImgHeightWidthIsOk.name} - height/width are correct`, () => {
    return withFixture("ampimg3", () =>
      assertFnList(
        runNetworkTest(
          AmpImgHeightWidthIsOk,
          "https://ampbyexample.com/introduction/hello_world/"
        ),
        (res) => {
          return res.length === 0
            ? ""
            : `expected 0 failures, got ${JSON.stringify(res)}`;
        }
      )
    );
  });

  it(`${AmpImgHeightWidthIsOk.name} - height/width are incorrect, but ignored`, () => {
    return withFixture("ampimg4", () =>
      assertFnList(
        runNetworkTest(AmpImgHeightWidthIsOk, "https://pyrite-coil.glitch.me"),
        (res) => {
          return res.length === 0
            ? ""
            : `expected 0 failures, got ${JSON.stringify(res)}`;
        }
      )
    );
  });

  it(`${AmpImgHeightWidthIsOk.name} - height/width are correct`, () => {
    return withFixture("ampimg5", () =>
      assertFnList(
        runNetworkTest(
          AmpImgHeightWidthIsOk,
          "https://charming-pirate.glitch.me/"
        ),
        (res) => {
          return res.length === 0
            ? ""
            : `expected 0 failures, got ${JSON.stringify(res)}`;
        }
      )
    );
  });
});

describe("CORS", () => {
  describe(EndpointsAreAccessibleFromOrigin.name, () => {
    it(`${EndpointsAreAccessibleFromOrigin.name} - all headers correct`, () => {
      return withFixture("cors1", () =>
        assertFnList(
          runNetworkTest(
            EndpointsAreAccessibleFromOrigin,
            "https://swift-track.glitch.me/"
          ),
          (res) => {
            return res.length === 0
              ? ""
              : `expected 0 failures, got ${JSON.stringify(res)}`;
          }
        )
      );
    });

    it(`${EndpointsAreAccessibleFromOrigin.name} - endpoint is 404`, () => {
      return withFixture("cors2", () =>
        assertMatch(
          runNetworkTest(
            EndpointsAreAccessibleFromOrigin,
            "https://swift-track.glitch.me/"
          ),
          "404"
        )
      );
    });

    it(`${EndpointsAreAccessibleFromOrigin.name} - endpoint not application/json`, () => {
      return withFixture("cors3", () =>
        assertMatch(
          runNetworkTest(
            EndpointsAreAccessibleFromOrigin,
            "https://swift-track.glitch.me/"
          ),
          "application/json"
        )
      );
    });
  });

  describe(EndpointsAreAccessibleFromCache.name, () => {
    it(`${EndpointsAreAccessibleFromCache.name} - all headers correct`, () => {
      return withFixture("cors4", () =>
        assertPass(
          runNetworkTest(
            EndpointsAreAccessibleFromCache,
            "https://swift-track.glitch.me/"
          )
        )
      );
    });
  });
});

describe(SxgVaryOnAcceptAct.name, () => {
  it(`${SxgVaryOnAcceptAct.name} - vary header not returned`, () => {
    return withFixture("sxgvary1", () => {
      return assertFail(
        runNetworkTest(
          SxgVaryOnAcceptAct,
          "https://boundless-stealer.glitch.me/"
        )
      );
    });
  });

  it(`${SxgVaryOnAcceptAct.name} - no vary on amp-cache-transform`, () => {
    return withFixture("sxgvary2", () => {
      return assertFail(
        runNetworkTest(
          SxgVaryOnAcceptAct,
          "https://boundless-stealer.glitch.me/"
        )
      );
    });
  });

  it(`${SxgVaryOnAcceptAct.name} - no vary on accept`, () => {
    return withFixture("sxgvary3", () => {
      return assertFail(
        runNetworkTest(
          SxgVaryOnAcceptAct,
          "https://boundless-stealer.glitch.me/"
        )
      );
    });
  });

  it(`${SxgVaryOnAcceptAct.name} - vary on accept and amp-cache-transform`, () => {
    return withFixture("sxgvary4", () => {
      return assertPass(
        runNetworkTest(
          SxgVaryOnAcceptAct,
          "https://boundless-stealer.glitch.me/"
        )
      );
    });
  });
});

describe(SxgContentNegotiationIsOk.name, () => {
  it(`${SxgContentNegotiationIsOk.name} - application/signed-exchange supported`, () => {
    return withFixture("sxgconneg1", () => {
      return assertPass(
        runNetworkTest(
          SxgContentNegotiationIsOk,
          "https://azei-package-test.com/"
        )
      );
    });
  });

  it(`${SxgContentNegotiationIsOk.name} - application/signed-exchange not supported`, () => {
    return withFixture("sxgconneg2", () => {
      return assertFail(
        runNetworkTest(
          SxgContentNegotiationIsOk,
          "https://boundless-stealer.glitch.me/"
        )
      );
    });
  });

  it(`${SxgContentNegotiationIsOk.name} - application/signed-exchange incorrectly supported`, () => {
    return withFixture("sxgconneg3", () => {
      return assertFail(
        runNetworkTest(
          SxgContentNegotiationIsOk,
          "https://azei-package-test.com/"
        )
      );
    });
  });
});

describe(SxgAmppkgIsForwarded.name, () => {
  it(`${SxgAmppkgIsForwarded.name} - /amppkg/ is forwarded`, () => {
    return withFixture("sxgamppkg2", () => {
      return assertPass(
        runNetworkTest(SxgAmppkgIsForwarded, "https://azei-package-test.com/")
      );
    });
  });

  it(`${SxgAmppkgIsForwarded.name} - /amppkg/ not forwarded (404)`, () => {
    return withFixture("sxgamppkg1", () => {
      return assertFail(
        runNetworkTest(
          SxgAmppkgIsForwarded,
          "https://boundless-stealer.glitch.me/"
        )
      );
    });
  });

  it(`${SxgAmppkgIsForwarded.name} - /amppkg/ not forwarded (wrong content-type)`, () => {
    return withFixture("sxgamppkg3", () => {
      return assertFail(
        runNetworkTest(SxgAmppkgIsForwarded, "https://azei-package-test.com/")
      );
    });
  });
});
