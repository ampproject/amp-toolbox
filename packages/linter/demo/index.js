const { lint } = require("../dist/index");
const cheerio = require("cheerio");
const fetch = require("node-fetch");

lintDocument("https://amp.dev");

async function lintDocument(url) {
  const body = await fetchDocument(url);

  const context = {
    url,
    $: cheerio.load(body),
    raw: {
      headers: {},
      body
    },
    headers: {},
    mode: "amp"
  };

  const result = await lint(context);
  console.log(result);
}

async function fetchDocument(url) {
  const response = await fetch(url);
  return response.text();
}
