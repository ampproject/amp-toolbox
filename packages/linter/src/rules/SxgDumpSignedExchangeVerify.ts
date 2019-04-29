import { default as fetch } from "node-fetch";
import execa from "execa";
import { fetchToCurl } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";

export class SxgDumpSignedExchangeVerify extends Rule {
  async run({ url, headers }: Context) {
    const opt = {
      headers: Object.assign(
        {
          accept: "application/signed-exchange;v=b3",
          "amp-cache-transform": `google;v="1"`
        },
        headers
      )
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
    const ARGS = [`-verify`];
    let sxg;
    try {
      sxg = await execa(CMD, ARGS, { input: body }).then(spawn => {
        const { stdout } = spawn;
        let m: ReturnType<typeof String.prototype.match>;
        m = stdout.match(/^The exchange has valid signature.$/m);
        const isValid = !!m;
        m = stdout.match(/^format version: (\S+)$/m);
        const version = m && m[1];
        m = stdout.match(/^  uri: (\S+)$/m);
        const uri = m && m[1];
        m = stdout.match(/^  status: (\S+)$/m);
        const status = m && parseInt(m[1], 10);
        return { isValid, version, uri, status };
      });
    } catch (e) {
      if (e.code === "ENOENT") {
        return this.warn(
          `not testing: couldn't execute [${
            e.cmd
          }] (not installed? not in PATH?)`
        );
      } else {
        const debug = `echo ${body.toString(
          "base64"
        )} | base64 -D | ${CMD} ${ARGS.join(" ")}`;
        return this.fail(
          `error: [${e.cmd}] returned [${e.stderr}] [debug: ${debug}]`
        );
      }
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
}
