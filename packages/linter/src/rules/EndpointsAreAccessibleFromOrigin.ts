import fetch from "node-fetch";

import {
  corsEndpoints,
  buildSourceOrigin,
  addSourceOrigin,
  absoluteUrl,
  fetchToCurl,
} from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";
import { isStatusOk, isJson, notPass } from "../filter";

export class EndpointsAreAccessibleFromOrigin extends Rule {
  async run(context: Context) {
    const e = corsEndpoints(context.$);
    const canXhrSameOrigin = (xhrUrl: string) => {
      xhrUrl = absoluteUrl(xhrUrl, context.url)!;
      const sourceOrigin = buildSourceOrigin(context.url);

      const headers = Object.assign(
        { "amp-same-origin": "true" },
        context.headers
      );

      const debug = fetchToCurl(addSourceOrigin(xhrUrl, sourceOrigin), {
        headers,
      });

      return fetch(addSourceOrigin(xhrUrl, sourceOrigin), { headers })
        .then(isStatusOk)
        .then(isJson)
        .then(
          () => this.pass(`${xhrUrl} is accessible from ${sourceOrigin}`),
          (e) =>
            this.fail(`can't XHR [${xhrUrl}]: ${e.message} [debug: ${debug}]`)
        );
    };
    return (
      await Promise.all(
        e.map((url) =>
          canXhrSameOrigin(absoluteUrl(url.toString(), context.url) || "")
        )
      )
    ).filter(notPass);
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cors-requests/",
      title: "Endpoints are accessible from origin",
      info: "",
    };
  }
}
