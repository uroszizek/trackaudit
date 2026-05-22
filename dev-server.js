const http = require("http");
const handler = require("./api/crawl.js");

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

  if (req.method === "POST" && req.url === "/api/crawl") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try { req.body = JSON.parse(body); } catch { req.body = {}; }

      let responded = false;

      const mockRes = {
        setHeader: () => {},
        status: (code) => ({
          json: (data) => {
            if (responded) return;
            responded = true;
            const json = JSON.stringify(data);
            res.writeHead(code, { "Content-Type": "application/json" });
            res.end(json);
          },
          end: () => {
            if (responded) return;
            responded = true;
            res.writeHead(code);
            res.end();
          }
        }),
        json: (data) => {
          if (responded) return;
          responded = true;
          const json = JSON.stringify(data);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(json);
        },
        end: () => {
          if (responded) return;
          responded = true;
          res.writeHead(200);
          res.end();
        }
      };

      try {
        await handler(req, mockRes);
      } catch (err) {
        console.error("[DEV-SERVER] Unhandled error:", err.message);
        console.error(err.stack);
        if (!responded) {
          responded = true;
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Server error", detail: err.message }));
        }
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

server.listen(3001, () => {
  console.log("✅ TrackAudit API running on http://localhost:3001");
  console.log("   POST /api/crawl  →  live crawl endpoint");
  console.log("\n   Start frontend with: npm run dev");
});
