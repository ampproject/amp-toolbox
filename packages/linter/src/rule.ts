import { Context, Result, Status } from "./index";

// Don't completely understand why we need to do this instead of "typeof Rule"
// (should be equivalent??) but whatever. See
// https://stackoverflow.com/a/52358194/11543
export interface RuleConstructor {
  new (): Rule;
}

export abstract class Rule {
  abstract run(context: Context): Promise<Result | Array<Result>>;
  public meta() {
    return {
      url: "",
      title:
        this.constructor.name.replace(
          /([a-z])([A-Z])/g,
          (_, c1, c2) => `${c1} ${c2.toLowerCase()}`
        ) + "?",
      info: "",
    };
  }
  protected async pass(s?: string) {
    return {
      status: Status.PASS,
      message: s,
      ...this.meta(),
    };
  }
  protected async fail(s: string) {
    return {
      status: Status.FAIL,
      message: s,
      ...this.meta(),
    };
  }
  protected async warn(s: string) {
    return {
      status: Status.WARN,
      message: s,
      ...this.meta(),
    };
  }
  protected async info(s: string) {
    return {
      status: Status.INFO,
      message: s,
      ...this.meta(),
    };
  }
}
