import { URL } from "url";
import { default as fetch } from "node-fetch";
import { fetchToCurl } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";
export class SxgAmppkgIsForwarded extends Rule {
  async run({ url, headers }: Context) {
    const validity = (() => {
      const { protocol, host } = new URL(url);
      return `${protocol}//${host}/amppkg/validity`;
    })();
    const res = await fetch(validity, { headers });
    const contentType = res.headers.get("content-type");
    // Substring instead of equality because some server provide a
    // charset--probably incorrectly, but seems to work, so...
    return res.ok && contentType && contentType.includes("application/cbor")
      ? this.pass()
      : this.fail(
          `/amppkg/ not forwarded to amppackager [debug: ${fetchToCurl(
            validity,
            {
              headers,
            }
          )}]`
        );
  }
  meta() {
    return {
      url: "",
      title: "/amppkg/ is forwarded correctly",
      info: "",
    };
  }
}
