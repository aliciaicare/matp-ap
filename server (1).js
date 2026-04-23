const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const API_KEY = (process.env.ANTHROPIC_API_KEY || "").trim();

const server = http.createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(path.join(__dirname, "index.html")));
    return;
  }

  if (req.method === "POST" && req.url === "/proxy") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      const options = {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body)
        }
      };
      const proxy = https.request(options, apiRes => {
        let data = "";
        apiRes.on("data", c => data += c);
        apiRes.on("end", () => {
          res.writeHead(apiRes.statusCode, {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          });
          res.end(data);
        });
      });
      proxy.on("error", e => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: { message: e.message } }));
      });
      proxy.write(body);
      proxy.end();
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

// Keep-alive settings to prevent Render timeouts
server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;

// Must bind to 0.0.0.0 for Render
server.listen(PORT, "0.0.0.0", () => {
  console.log("MATP App running on port " + PORT);
});
