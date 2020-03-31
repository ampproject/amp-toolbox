const CONCURRENCY = 8;

import { parse, format, resolve } from "url";
import { stringify } from "querystring";

import throat from "throat";
import fetch, { Request } from "node-fetch";
import probe from "probe-image-size";

import { Context } from "./";

export function schemaMetadata($: CheerioStatic) {
  const metadata = JSON.parse(
    $('script[type="application/ld+json"]').html() as string
  );
  return metadata ? metadata : {};
}

/**
 * Adds `__amp_source_origin` query parameter to URL.
 *
 * @param url
 * @param sourceOrigin
 */
export function addSourceOrigin(url: string, sourceOrigin: string) {
  const obj = parse(url, true);
  obj.query.__amp_source_origin = sourceOrigin;
  obj.search = stringify(obj.query);
  return format(obj);
}

export function buildSourceOrigin(url: string) {
  const obj = parse(url, true);
  return `${obj.protocol}//${obj.host}`;
}

export function corsEndpoints($: CheerioStatic) {
  const result: string[] = [];
  const storyBookendSrc = $("amp-story amp-story-bookend").attr("src");
  if (storyBookendSrc) {
    result.push(storyBookendSrc);
  }
  const bookendConfigSrc = $("amp-story").attr("bookend-config-src");
  if (bookendConfigSrc) {
    result.push(bookendConfigSrc);
  }
  const ampListSrc = $("amp-list[src]")
    .map((_, e) => $(e).attr("src"))
    .get() as String[];
  return (result as String[]).concat(ampListSrc);
}

export const absoluteUrl = (
  s: string | undefined,
  base: string | undefined
) => {
  if (typeof s !== "string" || typeof base !== "string") {
    return undefined;
  } else {
    return resolve(base, s);
  }
};

export function fetchToCurl(
  url: string,
  init: { headers?: { [k: string]: string } } = { headers: {} },
  includeHeaders = true
) {
  const headers = init.headers || {};

  const h = Object.keys(headers)
    .map((k) => `-H '${k}: ${headers[k]}'`)
    .join(" ");

  return `curl -sS ${includeHeaders ? " -i " : ""}${h} '${url}'`;
}

export const redirectUrl = throat(
  CONCURRENCY,
  async (context: Context, s: string | Request) => {
    const res = await fetch(s, { headers: context.headers });
    return res.url;
  }
);

export function dimensions(
  context: Context,
  url: string
): Promise<{ width: number; height: number; mime: string; [k: string]: any }> {
  // Try to prevent server from sending us encoded/compressed streams, since
  // probe-image-size can't handle them:
  // https://github.com/nodeca/probe-image-size/issues/28
  const headers = Object.assign({}, context.headers);
  delete headers["accept-encoding"];
  return probe(absoluteUrl(url, context.url), { headers });
}

export const contentLength = throat(
  CONCURRENCY,
  async (context: Context, s: string | Request) => {
    const options = Object.assign(
      {},
      { method: "HEAD" },
      { headers: context.headers }
    );
    const res = await fetch(s, options);
    if (!res.ok) {
      return Promise.reject(res);
    }
    const contentLength = res.headers.get("content-length");
    return contentLength ? contentLength : 0;
  }
);
