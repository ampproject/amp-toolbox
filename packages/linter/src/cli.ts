import { readFileSync } from "fs";
import { isArray } from "util";

import program from "commander";
import fetch from "node-fetch";
import cheerio from "cheerio";
import chalk from "chalk";

import { lint, Result, LintMode, guessMode, Status } from ".";
import { fetchToCurl } from "./helper";

// import { version } from "../package.json";

const UA = {
  googlebot_mobile: [
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36",
    "(KHTML, like Gecko) Chrome/41.0.2272.96 Mobile Safari/537.36",
    "(compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
  ].join(" "),
  googlebot_desktop: [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible;",
    "Googlebot/2.1; +http://www.google.com/bot.html) Safari/537.36"
  ].join(" "),
  chrome_mobile: [
    "Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012)",
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Mobile Safari/537.36"
  ].join(" "),
  chrome_desktop: [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3)",
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36"
  ].join(" ")
};

export function cli(argv: string[], logger = console, cmd='amplint') {
  program
    // .version(version)
    .usage(`${cmd} [options] URL|copy_as_cURL`)
    .option(
      `-f, --force <string>`,
      "override test type",
      /^(auto|sxg|amp|ampstory)$/i, // needs to be of type LintMode | "auto"
      "auto"
    )
    .option(
      `-t, --format <string>`,
      "override output format",
      /^(text|json|tsv|html)$/i,
      "text"
    )
    .option(
      `-A, --user-agent <string>`,
      "user agent string",
      /^(googlebot_desktop|googlebot_mobile|chrome_desktop|chrome_mobile)$/i,
      "googlebot_mobile"
    )
    .on("--help", function() {
      logger.log("");
      logger.log("Examples:");
      logger.log(`  $ ${cmd} https://amp.dev/`);
      logger.log(`  $ ${cmd} --force sxg https://amp.dev/`);
    });

  if (argv.length <= 2) {
    program.help();
  }

  function seq(first: number, last: number): number[] {
    if (first < last) {
      return [first].concat(seq(first + 1, last));
    } else if (first > last) {
      return [last].concat(seq(first, last - 1));
    } else {
      return [first];
    }
  }

  // One reason to support curl-style arguments is to provide cookies that avoid
  // GDPR interstitials.
  const headers: { [k: string]: string } = seq(2, argv.length - 1)
    .filter(n => argv[n] === "-H")
    .map(n => argv[n + 1])
    .map(s => {
      const [h, ...v] = s.split(": ");
      return [h, v.join("")];
    })
    .reduce((a: { [key: string]: any }, kv) => {
      a[kv[0]] = kv[1];
      return a;
    }, {});

  // Options is argv with "curl" and all -H flags removed (to pass to
  // program.parse())
  const options = seq(0, argv.length - 1)
    .filter(n => argv[n] !== "curl" && argv[n] !== "-H" && argv[n - 1] !== "-H")
    .map(n => argv[n]);

  program.parse(options);

  const url = program.args[0];
  if (!url) {
    program.help();
  } else {
    program.url = url;
  }

  program.headers = headers;

  return easyLint((program as unknown) as {
    userAgent: string;
    format: string;
    force: LintMode | "auto";
    url: string;
    headers: { [k: string]: string };
  })
    .then(logger.info.bind(logger))
    .catch(e => {
      logger.error(e.stack || e.message || e);
      process.exitCode = 1;
    });
}

export async function easyLint({
  url,
  userAgent,
  format,
  force,
  headers
}: {
  url: string;
  userAgent: string;
  format: string;
  force: LintMode | "auto";
  headers: { [k: string]: string };
}) {
  headers["user-agent"] = UA[userAgent as keyof typeof UA];

  const raw = await (async () => {
    if (url === "-") {
      return Promise.resolve({
        body: readFileSync("/dev/stdin").toString(),
        headers: {}
      });
    }
    const debug = fetchToCurl(url, { headers });
    try {
      const res = await fetch(url, { headers });
      return res.ok
        ? Promise.resolve({
            headers: res.headers,
            body: await res.text()
          })
        : Promise.reject(
            `couldn't load [${url}]: ${res.statusText} [debug: ${debug}]`
          );
    } catch (e) {
      return Promise.reject(`couldn't load [${url}] [debug: ${debug}]`);
    }
  })();

  const $ = cheerio.load(raw.body);
  const mode = force === "auto" ? guessMode($) : force;
  return printer(
    format,
    await lint({
      raw,
      $,
      headers,
      url,
      mode
    })
  );
}

function colorStatus(s: Status) {
  switch (s) {
    case Status.PASS:
      return chalk.green(s);
    case Status.FAIL:
      return chalk.red(s);
    case Status.WARN:
      return chalk.yellow(s);
    case Status.INFO:
    default:
      return s;
  }
}

function printer(
  type: string,
  data: { [key: string]: Result | Result[] }
): string {
  function flatten(data: { [k: string]: Result | Result[] }): string[][] {
    const rows: string[][] = [];
    rows.push(["id", "title", "status", "message"]);
    for (const k of Object.keys(data).sort()) {
      const v = data[k];
      if (!isArray(v)) {
        rows.push([k, v.title, v.status, v.message || ""]);
      } else {
        for (const vv of v) {
          rows.push([k, vv.title, vv.status, vv.message || ""]);
        }
      }
    }
    return rows;
  }
  let sep = "\t";
  switch (type) {
    case "tsv":
      return flatten(data)
        .map(l => l.join(sep))
        .join("\n");
    case "html":
      const res = flatten(data).splice(1);
      const thead = `<tr><th>Name</th><th>Status</th><th>Message</th><tr>`;
      const tbody = res
        .map(r => r.map(td => `<td>${escape(td)}</td>`).join(""))
        .map(r => `<tr>${r}</tr>`)
        .join("");
      return [
        `<table class="amplint">`,
        `<thead>`,
        thead,
        `</thead>`,
        `<tbody>`,
        tbody,
        `</tbody>`,
        `</table>`
      ].join("\n");
    case "json":
      return JSON.stringify(data, null, 2);
    case "text":
    default:
      return flatten(data)
        .splice(1)
        .map(l =>
          l[3] === ""
            ? `${colorStatus(l[2] as Status)} ${l[1]}\n`
            : `${colorStatus(l[2] as Status)} ${l[1]}\n> ${l[3]}\n`
        )
        .join("\n");
  }
}

if (require.main === module) {
  cli(process.argv);
}
