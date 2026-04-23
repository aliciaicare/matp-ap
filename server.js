
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 3000;
const KEY = (process.env.ANTHROPIC_API_KEY || "").trim();
const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(fs.readFileSync(path.join(__dirname, "index.html")));
    return;
  }
  if (req.method === "POST" && req.url === "/proxy") {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => {
      const r = https.request({
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body)
        }
      }, apiRes => {
        let data = "";
        apiRes.on("data", c => data += c);
        apiRes.on("end", () => {
          res.writeHead(apiRes.statusCode, {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"});
          res.end(data);
        });
      });
      r.on("error", e => {
        res.writeHead(500);
        res.end(JSON.stringify({error: {message: e.message}}));
      });
      r.write(body);
      r.end();
    });
    return;
  }
  res.writeHead(404);
  res.end("Not found");
});
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;
server.listen(PORT, "0.0.0.0", () => console.log("Running on " + PORT));
