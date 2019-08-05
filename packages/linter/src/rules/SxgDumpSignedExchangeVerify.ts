import { default as fetch } from "node-fetch";
import execa from "execa";
import { fetchToCurl } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";

function compare(
  expected: { [k: string]: boolean | string | number },
  actual: typeof expected
) {
  return Object.keys(expected).reduce(
    (acc, k) => {
      if (!actual[k]) {
        acc[k] = `expected: [${expected[k]}], actual: property missing`;
        return acc;
      } else if (expected[k] !== actual[k]) {
        acc[k] = `expected: [${expected[k]}], actual: [${actual[k]}]`;
        return acc;
      } else {
        return acc;
      }
    },
    {} as typeof expected
  );
}

async function urlHasContentType(
  url: string,
  headers: Context["headers"],
  contentType: string
) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    return false;
  }
  return res.headers.get("content-type") === contentType;
}

const REQUEST_HEADERS = {
  "accept": "application/signed-exchange;v=b3",
  "amp-cache-transform": `google;v="1"`
};
const EXPECTED_VERSION = "1b3";

export class SxgDumpSignedExchangeVerify extends Rule {
  async run({ url, headers }: Context) {
    const opt = {
      headers: {
        ...REQUEST_HEADERS,
        ...headers
      }
    };
    const res = await fetch(url, opt);
    const hdr = res.headers.get("content-type") || "";
    if (hdr.indexOf("application/signed-exchange") === -1) {
      return this.fail(
        `response is not [content-type: application/signed-exchange] [debug: ${fetchToCurl(
          url,
          opt
        )}]`
      );
    }
    const body = await res.buffer();
    const CMD = `dump-signedexchange`;
    const ARGS = [`-verify`, `-json`];
    const DEBUG = `${fetchToCurl(url, opt, false)} | ${CMD} ${ARGS.join(" ")}`;
    let sxg;
    try {
      sxg = await execa(CMD, ARGS, { input: body }).then(spawn => {
        const stdout = JSON.parse(spawn.stdout);
        return {
          isValid: stdout.Valid,
          version: stdout.Version,
          uri: stdout.RequestURI,
          status: stdout.ResponseStatus,
          signatures: stdout.Signatures
        };
      });
    } catch (e) {
      return this.warn(
        `not testing: couldn't execute [${CMD}] (not installed? not in PATH?)`
      );
    }
    const expected = {
      isValid: true,
      version: EXPECTED_VERSION,
      uri: url,
      status: 200
    };
    const diff = compare(expected, sxg);
    if (Object.keys(diff).length !== 0) {
      return this.fail(
        `[${url}] is not valid [${JSON.stringify(diff)}] [debug: ${DEBUG}]`
      );
    }
    const certUrl = sxg.signatures[0]["Params"]["cert-url"] as string;
    if (!certUrl) {
      return this.fail(`Can't find valid [cert-url] [${JSON.stringify(sxg)}]`);
    }
    if (
      !(await urlHasContentType(
        certUrl,
        headers,
        "application/cert-chain+cbor"
      ))
    ) {
      return this.fail(
        `cert-url [${certUrl}] is not found or has wrong content type`
      );
    }
    const validityUrl = sxg.signatures[0]["Params"]["validity-url"] as string;
    if (!validityUrl) {
      return this.fail(`Can't find valid [cert-url] [${JSON.stringify(sxg)}]`);
    }
    if (!(await urlHasContentType(validityUrl, headers, "application/cbor"))) {
      return this.fail(
        `validity-url [${validityUrl}] is not found or has wrong content type`
      );
    }
    const expires = sxg.signatures[0]["Params"]["expires"] as number;
    if (7 * 24 * 60 * 60 + Date.now() / 1000 < expires) {
      return this.fail(
        `the signed content expires more than 7 days into the future [at ${new Date(
          expires * 1000
        )}] [debug: ${DEBUG}]`
      );
    }
    return this.pass();
  }
  meta() {
    return {
      url: "",
      title: "no SXG errors found",
      info: ""
    };
  }
}
