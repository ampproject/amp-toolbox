/**
 * My App
 */
const fs = require("fs");
var http = require("http");
const express = require("express");
const app = express();

const port = 3001;

const indexHtml = fs.readFileSync("./index.html", "utf8");
app.get("/", (req, res) => {
  console.error("why many");
  optimize(indexHtml)
    .then(transformed => {
      res.set("Content-Type", "text/html");
      res.send(transformed);
    })
    .catch(err => {
      console.error(err);
      res.set("Content-Type", "text/plain");
      res.status = 500;
      res.send(`500: Internal Service Error`);
    });
});

app.listen(port, () => {
  console.log(`My demo app is running at http://localhost:${port}`);
});

process.on("SIGINT", function() {
  process.exit();
});

/**
 * Make a request to the optimizer at http://optimizer:3000
 */
function optimize(html) {
  return new Promise((resolve, reject) => {
    var options = {
      method: "POST",
      hostname: process.env.LOCAL ? "localhost" : "optimizer",
      port: "3000",
      path: "/",
      headers: {
        "Content-Type": "text/plain"
      }
    };

    var req = http.request(options, function(res) {
      var chunks = [];

      res.on("data", function(chunk) {
        chunks.push(chunk);
      });

      res.on("end", function() {
        var body = Buffer.concat(chunks);
        resolve(body);
      });
    });

    req.on("error", reject);
    req.end(html);
  });
}
