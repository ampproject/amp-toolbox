import { default as fetch } from "node-fetch";
import execa from "execa";
import { fetchToCurl } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";

export class SxgDumpSignedExchangeVerify extends Rule {
  async run({ url, headers }: Context) {
    const opt = {
      headers: {
        "accept": "application/signed-exchange;v=b3",
        "amp-cache-transform": `google;v="1"`,
        ...headers
      }
    };
    const res = await fetch(url, opt);
    const hdr = res.headers.get("content-type") || "";
    if (hdr.indexOf("application/signed-exchange") === -1) {
      return this.fail(
        `[content-type: application/signed-exchange] not returned for [accept: application/signed-exchange;v=b3], [amp-cache-transform: google;v="1"] [debug: ${fetchToCurl(
          url,
          opt
        )}]`
      );
    }
    const body = await res.buffer();
    const CMD = `dump-signedexchange`;
    const ARGS = [`-verify`, `-json`];
    let sxg;
    try {
      sxg = await execa(CMD, ARGS, { input: body }).then(spawn => {
        const stdout = JSON.parse(spawn.stdout);
        return {
          isValid: stdout.Valid,
          version: stdout.Valid,
          uri: stdout.RequestURI,
          status: stdout.ResponseStatus
        };
      });
    } catch (e) {
      return this.warn(
        `not testing: couldn't execute [${e.path}] (not installed? not in PATH?)`
      );
    }
    const debug = `${fetchToCurl(url, opt, false)} | ${CMD} ${ARGS.join(" ")}`;
    if (
      !sxg.isValid ||
      (sxg.uri !== url && sxg.version !== "1b3") ||
      sxg.status !== 200
    ) {
      return this.fail(
        `[${url}] is not valid SXG [${JSON.stringify(sxg)}] [debug: ${debug}]`
      );
    } else {
      return this.pass();
    }
  }
  meta() {
    return {
      url: "",
      title: "dump-signedexchanged -verify does not report errors",
      info: ""
    };
  }
}
