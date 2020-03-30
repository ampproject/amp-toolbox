import { Response } from "node-fetch";
import { Result, Status } from ".";

export function isPass(m: Result): boolean {
  return m.status === Status.PASS;
}

export function notPass(m: Result): boolean {
  return m.status !== Status.PASS;
}

export function isAccessControlHeaders(
  origin: string,
  sourceOrigin: string
): (res: Response) => Promise<Response> {
  return (res) => {
    const h1 = res.headers.get("access-control-allow-origin") || "";
    if (h1 !== origin && h1 !== "*") {
      throw new Error(
        `access-control-allow-origin header is [${h1}], expected [${origin}]`
      );
    }
    // The AMP docs specify that the AMP-Access-Control-Allow-Source-Origin and
    // Access-Control-Expose-Headers headers must be returned, but this is not
    // in true: the runtime does check this header, but only if the
    // requireAmpResponseSourceOrigin flag is true, and amp-story sets this to
    // false.
    //
    // https://www.ampproject.org/docs/fundamentals/amp-cors-requests#ensuring-secure-responses
    /*
    const h2 = res.headers.get('amp-access-control-allow-source-origin') || '';
    if (h2 !== sourceOrigin) throw new Error(
      `amp-access-control-allow-source-origin header is [${h2}], expected [${sourceOrigin}]`
    );
    const h3 = res.headers.get('access-control-expose-headers') || '';
    if (h3 !== 'AMP-Access-Control-Allow-Source-Origin') throw new Error(
      `access-control-expose-headers is [${h3}], expected [AMP-Access-Control-Allow-Source-Origin]`
    );
    */
    return Promise.resolve(res);
  };
}

export async function isJson(res: Response): Promise<Response> {
  const contentType = (() => {
    if (!res.headers) {
      return "";
    }
    const s = res.headers.get("content-type") || "";
    return s.toLowerCase().split(";")[0];
  })();
  if (contentType !== "application/json") {
    throw new Error(
      `expected content-type: [application/json]; actual: [${contentType}]`
    );
  }
  const text = await res.text();
  try {
    JSON.parse(text);
  } catch (e) {
    throw new Error(`couldn't parse body as JSON: ${text.substring(0, 100)}`);
  }
  return res;
}

export function isStatusOk(res: Response) {
  if (res.ok) {
    return Promise.resolve(res);
  } else {
    throw new Error(`expected status code: [2xx], actual [${res.status}]`);
  }
}

export function isStatusNotOk(res: Response) {
  if (!res.ok) {
    return Promise.resolve(res);
  } else {
    throw new Error(
      `expected status code: [1xx, 3xx, 4xx, 5xx], actual [${res.status}]`
    );
  }
}
