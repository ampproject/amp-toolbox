import { default as fetch } from "node-fetch";
import { Context } from "../index";
import { Rule } from "../rule";
import { fetchToCurl } from "../helper";

export class SxgContentNegotiationIsOk extends Rule {
  async run({ url, headers }: Context) {
    const opt1 = {
      headers: Object.assign({ accept: "text/html" }, headers),
    };
    const res1 = await fetch(url, opt1);
    const hdr1 = res1.headers.get("content-type") || "";
    if (hdr1.indexOf("application/signed-exchange") !== -1) {
      return this.fail(
        `[content-type: application/signed-exchange] incorrectly returned for [accept: text/html] [debug: ${fetchToCurl(
          url,
          opt1
        )}]`
      );
    }
    const opt2 = {
      headers: Object.assign(
        { accept: "application/signed-exchange;v=b3" },
        headers
      ),
    };
    const res2 = await fetch(url, opt2);
    const hdr2 = res2.headers.get("content-type") || "";
    if (hdr2.indexOf("application/signed-exchange") !== -1) {
      return this.fail(
        `[content-type: application/signed-exchange] incorrectly returned for [accept: application/signed-exchange;v=b3] [debug: ${fetchToCurl(
          url,
          opt2
        )}]`
      );
    }
    const opt3 = {
      headers: Object.assign(
        {
          "accept": "application/signed-exchange;v=b3",
          "amp-cache-transform": `google;v="1"`,
        },
        headers
      ),
    };
    const res3 = await fetch(url, opt3);
    const hdr3 = res3.headers.get("content-type") || "";
    if (hdr3.indexOf("application/signed-exchange") === -1) {
      return this.fail(
        `[content-type: application/signed-exchange] not returned for [accept: application/signed-exchange;v=b3], [amp-cache-transform: google;v="1"] [debug: ${fetchToCurl(
          url,
          opt3
        )}]`
      );
    }
    return this.pass();
  }
  meta() {
    return {
      url: "",
      title: "content negotiation is correct",
      info: "",
    };
  }
}
