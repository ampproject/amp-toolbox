const FIXTURES = "fixtures";

import { existsSync, readFile, readFileSync } from "fs";

import * as cheerio from "cheerio";
import debug from "debug";
import { diffJson as diff } from "diff";
import { back as nockBack } from "nock";
import { default as fetch } from "node-fetch";

import throat from "throat";
import { Status, Result, LintMode, guessMode } from "../src";
import { RuleConstructor } from "../src/rule";

const log = debug("linter");

nockBack.fixtures = `${__dirname}/${FIXTURES}`;

export let COUNT = 1;

// Need to throttle to one run at a time because nock() works by monkey patching
// the (global) http.* object, which means it can't run in parallel.
export const withFixture = throat(
  1,
  async <T>(fixtureName: string, fn: () => Promise<T>): Promise<T> => {
    const fixturePath = `${fixtureName}.json`;
    try {
      if (existsSync(`${nockBack.fixtures}/${fixturePath}`)) {
        log(`nocking HTTP requests with fixture [${fixturePath}]`);
        nockBack.setMode("lockdown");
        const { nockDone } = await nockBack(fixturePath);
        const res = await fn();
        nockDone();
        return res;
      } else {
        log(`recording HTTP requests to fixture [${fixturePath}] ...`);
        nockBack.setMode("record");
        const { nockDone } = await nockBack(fixturePath);
        const res = await fn();
        return new Promise<T>((resolve) => {
          setTimeout(() => {
            // wait for probe-image-size's aborts to settle
            nockDone();
            log(`... created fixture [${fixturePath}]`);
            resolve(res);
          }, 2000);
        });
      }
    } catch (e) {
      console.error(e);
      return ({} as unknown) as T;
    }
  }
) as <T>(fixtureName: string, fn: () => Promise<T>) => Promise<T>;

export async function assertPass(
  testName: string,
  actual: Promise<Result | Result[]>
) {
  return assertStatus(Status.PASS, testName, actual);
}

export async function assertWarn(
  testName: string,
  actual: Promise<Result | Result[]>
) {
  return assertStatus(Status.WARN, testName, actual);
}

export async function assertFail(
  testName: string,
  actual: Promise<Result | Result[]>
) {
  return assertStatus(Status.FAIL, testName, actual);
}

export async function assertStatus(
  expectedStatus: string,
  testName: string,
  actualPromise: Promise<Result | Result[]>
) {
  const c = COUNT++;
  const actual = ([] as Result[]).concat(await actualPromise);
  if (actual.length === 0) {
    return console.log(`ok ${c} - ${testName}`);
  }
  if (actual.length > 1) {
    return console.log(`not ok ${c} - ${testName} multiple results returned`);
  }
  const actualStatus = actual[0].status;
  if (actualStatus === expectedStatus) {
    return console.log(`ok ${c} - ${testName}`);
  } else {
    return console.log(
      `not ok ${c} - ${testName} actual status: ${JSON.stringify(
        actualStatus
      )}, expected status: ${JSON.stringify(expectedStatus)}`
    );
  }
}

export async function assertEqual<T extends object>(
  testName: string,
  actual: T | Promise<T>,
  expected: T | Promise<T>
) {
  const c = COUNT++;
  const res = diff(
    await Promise.resolve(expected),
    await Promise.resolve(actual)
  );
  if (res && res.length === 1) {
    console.log(`ok ${c} - ${testName}`);
  } else {
    const as = JSON.stringify(await Promise.resolve(actual));
    const es = JSON.stringify(await Promise.resolve(expected));
    console.log(`not ok ${c} - ${testName} actual: ${as}, expected: ${es}`);
  }
  return res;
}

export async function assertNotEqual<T extends object>(
  testName: string,
  actual: T | Promise<T>,
  expected: T | Promise<T>
) {
  const c = COUNT++;
  const res = diff(
    await Promise.resolve(expected),
    await Promise.resolve(actual)
  );
  if (res && res.length === 1) {
    const as = JSON.stringify(await Promise.resolve(actual));
    const es = JSON.stringify(await Promise.resolve(expected));
    console.log(`not ok ${c} - ${testName} actual: ${as}, not expected: ${es}`);
  } else {
    console.log(`ok ${c} - ${testName}`);
  }
  return res;
}

export async function assertMatch<T extends object>(
  testName: string,
  actual: T | Promise<T>,
  expected: RegExp | string
) {
  const c = COUNT++;
  const s = JSON.stringify(await Promise.resolve(actual));
  if (s.match(expected)) {
    console.log(`ok ${c} - ${testName}`);
  } else {
    console.log(
      `not ok ${c} - ${testName} actual: ${s}, expected regexp match: ${expected.toString()}`
    );
  }
}

export async function assertFn(
  testName: string,
  actual: Result | Promise<Result>,
  expectedFn: (actual: Result) => string
) {
  const c = COUNT++;
  const res = expectedFn(await actual);
  if (!res) {
    console.log(`ok ${c} - ${testName}`);
  } else {
    console.log(`not ok ${c} - ${testName} [${res}]`);
  }
  return res;
}

export async function assertFnList(
  testName: string,
  actual: Result | Result[] | Promise<Result | Result[]>,
  expectedFn: (actual: Result[]) => string
) {
  const c = COUNT++;
  const res = expectedFn(([] as Result[]).concat(await actual));
  if (!res) {
    console.log(`ok ${c} - ${testName}`);
  } else {
    console.log(`not ok ${c} - ${testName} [${res}]`);
  }
  return res;
}

export async function runLocalTest(ctor: RuleConstructor, fixture: string) {
  const body = readFileSync(fixture, { encoding: "utf8" });
  const $ = cheerio.load(body);
  const context = {
    $,
    headers: {},
    url: "",
    raw: { body, headers: {} },
    mode: guessMode($),
  };
  const rule = new ctor();
  return Promise.resolve(rule.run(context));
}

export async function runNetworkTest(ctor: RuleConstructor, url: string) {
  const res = await fetch(url);
  const body = await res.text();
  const $ = cheerio.load(body);
  const context = {
    $,
    headers: {},
    url,
    raw: { body, headers: {} },
    mode: guessMode($),
  };
  const rule = new ctor();
  return Promise.resolve(rule.run(context));
}

export async function runCheerioFn<T>(
  fn: ($: CheerioStatic, url?: string) => T | Promise<T>,
  url: string
) {
  const res = await fetch(url);
  const body = await res.text();
  const $ = cheerio.load(body);
  return Promise.resolve(fn($, url));
}

export async function runUrlFn<T>(fn: (url: string) => T, url: string) {
  return Promise.resolve(fn(url));
}
