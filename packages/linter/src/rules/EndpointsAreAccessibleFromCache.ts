import { parse } from "url";

import { createCacheUrl } from "@ampproject/toolbox-cache-url";
import fetch from "node-fetch";

import { caches } from "../caches";
import {
  corsEndpoints,
  buildSourceOrigin,
  addSourceOrigin,
  fetchToCurl,
  absoluteUrl,
} from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";
import { isStatusOk, isAccessControlHeaders, isJson, notPass } from "../filter";

export class EndpointsAreAccessibleFromCache extends Rule {
  async run(context: Context) {
    // Cartesian product from https://stackoverflow.com/a/43053803/11543
    const cartesian = (a: any[], b: any[]) =>
      ([] as any[]).concat(
        ...a.map((d: any) => b.map((e: any) => ([] as any[]).concat(d, e)))
      );
    const e = corsEndpoints(context.$);
    const product = cartesian(
      e,
      (await caches()).map((c) => c.cacheDomain)
    );
    const canXhrCache = async (xhrUrl: string, cacheSuffix: string) => {
      const sourceOrigin = buildSourceOrigin(context.url);
      const url = await createCacheUrl(cacheSuffix, context.url);
      const obj = parse(url);
      const origin = `${obj.protocol}//${obj.host}`;

      const headers = Object.assign({}, { origin }, context.headers);

      const curl = fetchToCurl(addSourceOrigin(xhrUrl, sourceOrigin), {
        headers,
      });

      return fetch(addSourceOrigin(xhrUrl, sourceOrigin), { headers })
        .then(isStatusOk)
        .then(isAccessControlHeaders(origin, sourceOrigin))
        .then(isJson)
        .then(
          () => this.pass(`${xhrUrl} is accessible from ${cacheSuffix}`),
          (e) =>
            this.fail(`can't XHR [${xhrUrl}]: ${e.message} [debug: ${curl}]`)
        );
    };
    return (
      await Promise.all(
        product.map(([xhrUrl, cacheSuffix]) =>
          canXhrCache(absoluteUrl(xhrUrl, context.url) || "", cacheSuffix)
        )
      )
    ).filter(notPass);
  }
  meta() {
    return {
      url:
        "https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cors-requests/",
      title: "Endpoints are accessible from cache",
      info: "",
    };
  }
}
