import { basename } from "path";
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

withFixture("thumbnails1", () =>
  assertFnList(
    `${StoryMetadataThumbnailsAreOk.name} - too small`,
    runNetworkTest(
      StoryMetadataThumbnailsAreOk,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    ),
    (actual: Result[]) => {
      return actual.length === 0
        ? ""
        : `expected no errors, got ${JSON.stringify(actual)}`;
    }
  )
);

withFixture("thumbnails2", () =>
  assertMatch(
    `${StoryMetadataThumbnailsAreOk.name} - publisher-logo-src missing`,
    runNetworkTest(
      StoryMetadataThumbnailsAreOk,
      "https://regular-biology.glitch.me/"
    ),
    "publisher-logo-src"
  )
);

withFixture("thumbnails3", () =>
  assertMatch(
    `${StoryMetadataThumbnailsAreOk.name} - poster-portrait-src not found`,
    runNetworkTest(StoryMetadataThumbnailsAreOk, "http://localhost:5000/"),
    "file not found"
  )
);

withFixture("thumbnails4", () =>
  assertFnList(
    `${StoryMetadataThumbnailsAreOk.name} - publisher-logo-src is webp`,
    runNetworkTest(
      StoryMetadataThumbnailsAreOk,
      "https://fantastic-lemon-asterisk.glitch.me/"
    ),
    (actual: Result[]) => {
      return actual.length === 0
        ? ""
        : `expected no errors, got ${JSON.stringify(actual)}`;
    }
  )
);

withFixture("testvalidity1", () =>
  assertPass(
    `${IsValid.name} - valid`,
    runNetworkTest(IsValid, "https://www.ampproject.org/")
  )
);

withFixture("testvalidity2", async () =>
  assertFail(
    `${IsValid.name} - not valid`,
    runNetworkTest(IsValid, "https://precious-sturgeon.glitch.me/")
  )
);

withFixture("testvalidity3", async () =>
  assertPass(
    `${IsValid.name} - valid with svg`,
    runNetworkTest(IsValid, "https://amp.dev/index.amp.html")
  )
);

withFixture("testcanonical1", () =>
  assertPass(
    `${LinkRelCanonicalIsOk.name} - canonical`,
    runNetworkTest(LinkRelCanonicalIsOk, "https://regular-biology.glitch.me/")
  )
);

withFixture("testcanonical2", () =>
  assertFail(
    `${LinkRelCanonicalIsOk.name} - not canonical`,
    runNetworkTest(LinkRelCanonicalIsOk, "https://copper-cupboard.glitch.me/")
  )
);

withFixture("testcanonical3", () =>
  assertPass(
    `${LinkRelCanonicalIsOk.name} - relative`,
    runNetworkTest(LinkRelCanonicalIsOk, "https://regular-biology.glitch.me/")
  )
);

withFixture("testcanonical4", () =>
  assertPass(
    `${LinkRelCanonicalIsOk.name} - not AMP Story`,
    runNetworkTest(
      LinkRelCanonicalIsOk,
      "https://bejewled-tachometer.glitch.me/"
    )
  )
);

withFixture("testvideosize1", () =>
  assertFail(
    `${AmpVideoIsSmall.name} - too big`,
    runNetworkTest(AmpVideoIsSmall, "https://regular-biology.glitch.me/")
  )
);

withFixture("testvideosize2", () =>
  assertPass(
    `${AmpVideoIsSmall.name} - good size #1`,
    runNetworkTest(AmpVideoIsSmall, "https://regular-biology.glitch.me/")
  )
);

withFixture("testvideosize3", () =>
  assertPass(
    `${AmpVideoIsSmall.name} - good size #2`,
    runNetworkTest(
      AmpVideoIsSmall,
      "https://ampbyexample.com/stories/features/media/preview/embed/"
    )
  )
);

withFixture("bookendsameorigin1", () =>
  assertPass(
    `${EndpointsAreAccessibleFromOrigin.name} - configured correctly`,
    runNetworkTest(
      EndpointsAreAccessibleFromOrigin,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    )
  )
);

withFixture("bookendsameorigin2", () =>
  assertMatch(
    `${EndpointsAreAccessibleFromOrigin.name} - bookend not application/json`,
    runNetworkTest(
      EndpointsAreAccessibleFromOrigin,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    ),
    "application/json"
  )
);

withFixture("bookendsameorigin3", () =>
  assertMatch(
    `${EndpointsAreAccessibleFromOrigin.name} - bookend not JSON`,
    runNetworkTest(
      EndpointsAreAccessibleFromOrigin,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    ),
    "JSON"
  )
);

withFixture("bookendsameorgin4", () =>
  assertPass(
    `${EndpointsAreAccessibleFromOrigin.name} - v0 AMP Story - configured correctly`,
    runNetworkTest(
      EndpointsAreAccessibleFromOrigin,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    )
  )
);

withFixture("bookendcache1", () =>
  assertPass(
    `${EndpointsAreAccessibleFromCache.name} - configured correctly`,
    runNetworkTest(
      EndpointsAreAccessibleFromCache,
      "https://preview.amp.dev/documentation/examples/introduction/stories_in_amp/"
    )
  )
);

withFixture("bookendcache2", () =>
  assertMatch(
    `${EndpointsAreAccessibleFromCache.name} - incorrect headers`,
    runNetworkTest(
      EndpointsAreAccessibleFromCache,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    ),
    "access-control-allow-origin"
  )
);

withFixture("ampstoryv1metadata1", () =>
  assertPass(
    `${StoryMetadataIsV1.name} - valid metadata`,
    runNetworkTest(
      StoryMetadataIsV1,
      "https://ithinkihaveacat.github.io/hello-world-amp-story/"
    )
  )
);

withFixture("ampstoryv1metadata2", () =>
  assertMatch(
    `${StoryMetadataIsV1.name} - invalid metadata`,
    runNetworkTest(
      StoryMetadataIsV1,
      "https://ithinkihaveacat-hello-world-amp-story-7.glitch.me/"
    ),
    "publisher-logo-src"
  )
);

withFixture("ampimg1", () =>
  assertFnList(
    `${AmpImgHeightWidthIsOk.name} - height/width are incorrect #1`,
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

withFixture("ampimg2", () =>
  assertFnList(
    `${AmpImgHeightWidthIsOk.name} - height/width are incorrect #2`,
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
      if (typeof message2 !== "string" || !message2.match("layers-layer-3")) {
        return "layers-layer-3.jpg is too big";
      }
      return "";
    }
  )
);

withFixture("ampimg3", () =>
  assertFnList(
    `${AmpImgHeightWidthIsOk.name} - height/width are correct`,
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

withFixture("ampimg4", () =>
  assertFnList(
    `${AmpImgHeightWidthIsOk.name} - height/width are incorrect, but ignored`,
    runNetworkTest(AmpImgHeightWidthIsOk, "https://pyrite-coil.glitch.me"),
    (res) => {
      return res.length === 0
        ? ""
        : `expected 0 failures, got ${JSON.stringify(res)}`;
    }
  )
);

withFixture("ampimg5", () =>
  assertFnList(
    `${AmpImgHeightWidthIsOk.name} - height/width are correct`,
    runNetworkTest(AmpImgHeightWidthIsOk, "https://charming-pirate.glitch.me/"),
    (res) => {
      return res.length === 0
        ? ""
        : `expected 0 failures, got ${JSON.stringify(res)}`;
    }
  )
);

withFixture("cors1", () =>
  assertFnList(
    `${EndpointsAreAccessibleFromOrigin.name} - all headers correct`,
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

withFixture("cors2", () =>
  assertMatch(
    `${EndpointsAreAccessibleFromOrigin.name} - endpoint is 404`,
    runNetworkTest(
      EndpointsAreAccessibleFromOrigin,
      "https://swift-track.glitch.me/"
    ),
    "404"
  )
);

withFixture("cors3", () =>
  assertMatch(
    `${EndpointsAreAccessibleFromOrigin.name} - endpoint not application/json`,
    runNetworkTest(
      EndpointsAreAccessibleFromOrigin,
      "https://swift-track.glitch.me/"
    ),
    "application/json"
  )
);

withFixture("cors4", () =>
  assertPass(
    `${EndpointsAreAccessibleFromCache.name} - all headers correct`,
    runNetworkTest(
      EndpointsAreAccessibleFromCache,
      "https://swift-track.glitch.me/"
    )
  )
);

withFixture("sxgvary1", () => {
  return assertFail(
    `${SxgVaryOnAcceptAct.name} - vary header not returned`,
    runNetworkTest(SxgVaryOnAcceptAct, "https://boundless-stealer.glitch.me/")
  );
});

withFixture("sxgvary2", () => {
  return assertFail(
    `${SxgVaryOnAcceptAct.name} - no vary on amp-cache-transform`,
    runNetworkTest(SxgVaryOnAcceptAct, "https://boundless-stealer.glitch.me/")
  );
});

withFixture("sxgvary3", () => {
  return assertFail(
    `${SxgVaryOnAcceptAct.name} - no vary on accept`,
    runNetworkTest(SxgVaryOnAcceptAct, "https://boundless-stealer.glitch.me/")
  );
});

withFixture("sxgvary4", () => {
  return assertPass(
    `${SxgVaryOnAcceptAct.name} - vary on accept and amp-cache-transform`,
    runNetworkTest(SxgVaryOnAcceptAct, "https://boundless-stealer.glitch.me/")
  );
});

withFixture("sxgconneg1", () => {
  return assertPass(
    `${SxgContentNegotiationIsOk.name} - application/signed-exchange supported`,
    runNetworkTest(SxgContentNegotiationIsOk, "https://azei-package-test.com/")
  );
});

withFixture("sxgconneg2", () => {
  return assertFail(
    `${SxgContentNegotiationIsOk.name} - application/signed-exchange not supported`,
    runNetworkTest(
      SxgContentNegotiationIsOk,
      "https://boundless-stealer.glitch.me/"
    )
  );
});

withFixture("sxgconneg3", () => {
  return assertFail(
    `${SxgContentNegotiationIsOk.name} - application/signed-exchange incorrectly supported`,
    runNetworkTest(SxgContentNegotiationIsOk, "https://azei-package-test.com/")
  );
});

withFixture("sxgamppkg2", () => {
  return assertPass(
    `${SxgAmppkgIsForwarded.name} - /amppkg/ is forwarded`,
    runNetworkTest(SxgAmppkgIsForwarded, "https://azei-package-test.com/")
  );
});

withFixture("sxgamppkg1", () => {
  return assertFail(
    `${SxgAmppkgIsForwarded.name} - /amppkg/ not forwarded (404)`,
    runNetworkTest(SxgAmppkgIsForwarded, "https://boundless-stealer.glitch.me/")
  );
});

withFixture("sxgamppkg3", () => {
  return assertFail(
    `${SxgAmppkgIsForwarded.name} - /amppkg/ not forwarded (wrong content-type)`,
    runNetworkTest(SxgAmppkgIsForwarded, "https://azei-package-test.com/")
  );
});

console.log(`# ${basename(__filename)} - tests with mocked HTTP responses`);
console.log(`1..41`);
