import { default as fetch } from "node-fetch";
import { fetchToCurl } from "../helper";
import { Context } from "../index";
import { Rule } from "../rule";

export class SxgVaryOnAcceptAct extends Rule {
  async run({ url, headers }: Context) {
    headers.accept = "text/html,application/signed-exchange;v=b3";
    const res = await fetch(url, { headers });
    const debug = `debug: ${fetchToCurl(url, { headers })}`;
    const vary = ("" + res.headers.get("vary"))
      .split(",")
      .map((s) => s.toLowerCase().trim());
    if (vary.length == 0)
      return this.fail(`[vary] header is missing [${debug}]`);
    if (!vary.includes("amp-cache-transform"))
      return this.fail(
        `[vary] header is missing value [amp-cache-transform] [${debug}]`
      );
    if (!vary.includes("accept"))
      return this.fail(`[vary] header is missing value [accept] [${debug}]`);
    return this.pass();
  }
  meta() {
    return {
      url: "",
      title: "vary header is correct",
      info: "",
    };
  }
}
