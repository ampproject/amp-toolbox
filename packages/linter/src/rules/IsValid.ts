import { validate } from "../validate";
import { Context } from "../index";
import { Rule } from "../rule";

export class IsValid extends Rule {
  async run({ raw }: Context) {
    const res = await validate(raw.body);
    return res.status === "PASS"
      ? this.pass()
      : this.fail(JSON.stringify(res.errors));
  }
  meta() {
    return {
      url: "https://validator.amp.dev/",
      title: "Document is valid AMP",
      info: "",
    };
  }
}
