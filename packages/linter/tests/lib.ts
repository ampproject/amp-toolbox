const FIXTURES = "fixtures";

import { existsSync, readFileSync } from "fs";

import * as cheerio from "cheerio";
import debug from "debug";
import { diffJson as diff } from "diff";
import { back as nockBack } from "nock";
import { default as fetch } from "node-fetch";

import throat from "throat";
import { Status, Result, guessMode } from "../src";
import { RuleConstructor } from "../src/rule";

const log = debug("linter");

nockBack.fixtures = `${__dirname}/${FIXTURES}`;

// Need to throttle to one run at a time because nock() works by monkey patching
// the (global) http.* object, which means it can't run in parallel.
export const withFixture = throat(
  1,
  async <T>(fixtureName: string, fn: () => Promise<T>): Promise<T> => {
    const fixturePath = `${fixtureName}.json`;
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
  }
) as <T>(fixtureName: string, fn: () => Promise<T>) => Promise<T>;

export async function assertPass(actual: Promise<Result | Result[]>) {
  return assertStatus(Status.PASS, actual);
}

export async function assertInfo(actual: Promise<Result | Result[]>) {
  return assertStatus(Status.INFO, actual);
}

export async function assertWarn(actual: Promise<Result | Result[]>) {
  return assertStatus(Status.WARN, actual);
}

export async function assertFail(actual: Promise<Result | Result[]>) {
  return assertStatus(Status.FAIL, actual);
}

export async function assertStatus(
  expectedStatus: string,
  actualPromise: Promise<Result | Result[]>
) {
  const actual = ([] as Result[]).concat(await actualPromise);
  if (actual.length === 0) {
    if (expectedStatus === Status.PASS) {
      return;
    } else {
      throw new Error("no results returned");
    }
  }
  if (actual.length > 1) {
    throw new Error("multiple results returned");
  }
  const actualStatus = actual[0].status;
  if (actualStatus === expectedStatus) {
    return;
  } else {
    throw new Error(
      `actual status: ${JSON.stringify(
        actualStatus
      )}, expected status: ${JSON.stringify(expectedStatus)}`
    );
  }
}

export async function assertEqual<T extends object>(
  actual: T | Promise<T>,
  expected: T | Promise<T>
) {
  const res = diff(
    await Promise.resolve(expected),
    await Promise.resolve(actual)
  );
  if (!res || res.length !== 1) {
    const as = JSON.stringify(await Promise.resolve(actual));
    const es = JSON.stringify(await Promise.resolve(expected));
    throw new Error(`actual: ${as}, expected: ${es}`);
  }
  return res;
}

export async function assertNotEqual<T extends object>(
  actual: T | Promise<T>,
  expected: T | Promise<T>
) {
  const res = diff(
    await Promise.resolve(expected),
    await Promise.resolve(actual)
  );
  if (res && res.length === 1) {
    const as = JSON.stringify(await Promise.resolve(actual));
    const es = JSON.stringify(await Promise.resolve(expected));
    throw new Error(`actual: ${as}, not expected: ${es}`);
  }
  return res;
}

export async function assertMatch<T extends object>(
  actual: T | Promise<T>,
  expected: RegExp | string
) {
  const s = JSON.stringify(await Promise.resolve(actual));
  if (!s.match(expected)) {
    throw new Error(
      `actual: ${s}, expected regexp match: ${expected.toString()}`
    );
  }
}

export async function assertFn(
  actual: Result | Promise<Result>,
  expectedFn: (actual: Result) => string
) {
  const res = expectedFn(await actual);
  if (res) {
    throw new Error(`[${res}]`);
  }
  return res;
}

export async function assertFnList(
  actual: Result | Result[] | Promise<Result | Result[]>,
  expectedFn: (actual: Result[]) => string
) {
  const res = expectedFn(([] as Result[]).concat(await actual));
  if (res) {
    throw new Error(`[${res}]`);
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
