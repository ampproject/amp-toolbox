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
  protected pass(s?: string) {
    return Promise.resolve({
      status: Status.PASS,
      message: s,
      url: Rule.href,
      description: Rule.info
    });
  }
  protected fail(s: string) {
    return Promise.resolve({
      status: Status.FAIL,
      message: s,
      url: Rule.href,
      description: Rule.info
    });
  }
  protected warn(s: string) {
    return Promise.resolve({
      status: Status.WARN,
      message: s,
      url: Rule.href,
      description: Rule.info
    });
  }
  protected info(s: string) {
    return Promise.resolve({
      status: Status.INFO,
      message: s,
      url: Rule.href,
      description: Rule.info
    });
  }
}
