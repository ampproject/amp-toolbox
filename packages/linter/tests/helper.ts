import { basename } from "path";

import { withFixture, assertEqual, runCheerioFn } from "./lib";
import { schemaMetadata, corsEndpoints } from "../src/helper";
import { _inlineMetadata as inlineMetadata } from "../src/rules/StoryMetadataThumbnailsAreOk";

withFixture("getschemametadata", () =>
  assertEqual(
    schemaMetadata.name,
    runCheerioFn(
      schemaMetadata,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    ),
    {
      "@context": "http://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "item": {
            "@id": "https://ampbyexample.com/#/stories#stories/introduction",
            "name": "Introduction",
          },
          "position": 1,
        },
        {
          "@type": "ListItem",
          "item": {
            "@id":
              "https://ampbyexample.com/stories/introduction/amp_story_hello_world/",
            "name": " AMP Story Hello World",
          },
          "position": 2,
        },
      ],
    }
  )
);

withFixture("getinlinemetadata", () =>
  assertEqual(
    inlineMetadata.name,
    runCheerioFn(
      inlineMetadata,
      "https://ithinkihaveacat.github.io/hello-world-amp-story/"
    ),
    {
      "poster-portrait-src": [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/",
        "Cantilever_bridge_human_model.jpg/",
        "627px-Cantilever_bridge_human_model.jpg",
      ].join(""),
      "publisher": "Michael Stillwell",
      "publisher-logo-src":
        "https://s.gravatar.com/avatar/3928085cafc1e496fb3d990a9959f233?s=150",
      "title": "Hello, Ken Burns",
    }
  )
);

withFixture("corsendpoints1", () =>
  assertEqual(
    `${corsEndpoints.name} - AMP`,
    runCheerioFn(corsEndpoints, "https://swift-track.glitch.me/"),
    ["https://ampbyexample.com/json/examples.json"]
  )
);

withFixture("corsendpoints2", () =>
  assertEqual(
    `${corsEndpoints.name} - AMP Story`,
    runCheerioFn(
      corsEndpoints,
      "https://ampbyexample.com/stories/introduction/amp_story_hello_world/preview/embed/"
    ),
    ["https://ampbyexample.com/json/bookend.json"]
  )
);

console.log(`# ${basename(__filename)} - tests of helper functions`);
console.log(`1..4`);
