import { Context, Result, Status } from "./index";

// Don't completely understand why we need to do this instead of "typeof Rule"
// (should be equivalent??) but whatever. See
// https://stackoverflow.com/a/52358194/11543
export interface RuleConstructor {
  new (): Rule;
}

export abstract class Rule {
  static href = "";
  static info = "";
  abstract run(context: Context): Promise<Result | Array<Result>>;
  protected async pass(s?: string) {
    return {
      status: Status.PASS,
      message: s,
      url: Rule.href,
      description: Rule.info
    };
  }
  protected async fail(s: string) {
    return {
      status: Status.FAIL,
      message: s,
      url: Rule.href,
      description: Rule.info
    };
  }
  protected async warn(s: string) {
    return {
      status: Status.WARN,
      message: s,
      url: Rule.href,
      description: Rule.info
    };
  }
  protected async info(s: string) {
    return {
      status: Status.INFO,
      message: s,
      url: Rule.href,
      description: Rule.info
    };
  }
}
