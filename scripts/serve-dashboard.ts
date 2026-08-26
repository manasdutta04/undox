/**
 * Local Exposure Dashboard for Savile Row demos.
 * Run: npm run dashboard:serve → http://127.0.0.1:8793/?session=demo-double-o-1
 */

import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDashboardOrEmpty } from "../src/agents/dashboard-api.js";
import { listSessionIds } from "../src/mcp/undox-tools/session-store.js";

const PORT = Number(process.env.UNDOX_DASHBOARD_PORT ?? 8793);
const HERE = dirname(fileURLToPath(import.meta.url));
const PAGE = resolve(HERE, "../src/ui/dashboard/index.html");

function json(res: import("node:http").ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

createServer((req, res) => {
  const raw = req.url ?? "/";
  let url: URL;
  try {
    url = new URL(raw, `http://127.0.0.1:${PORT}`);
  } catch {
    res.writeHead(400, { "content-type": "text/plain" });
    res.end("Bad request");
    return;
  }

  if (url.pathname === "/api/sessions") {
    try {
      json(res, 200, { sessions: listSessionIds() });
    } catch (err) {
      json(res, 500, { error: "Failed to read session store", detail: String(err) });
    }
    return;
  }

  const sessionMatch = url.pathname.match(/^\/api\/session\/([^/]+)$/);
  if (sessionMatch) {
    let sessionId: string;
    try {
      sessionId = decodeURIComponent(sessionMatch[1]!);
    } catch {
      json(res, 400, { error: "Malformed session id encoding" });
      return;
    }
    json(res, 200, getDashboardOrEmpty(sessionId));
    return;
  }

  if (url.pathname === "/" || url.pathname === "/index.html") {
    if (!existsSync(PAGE)) {
      res.writeHead(500, { "content-type": "text/plain" });
      res.end("Missing src/ui/dashboard/index.html");
      return;
    }
    const html = readFileSync(PAGE);
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(html);
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not found");
}).listen(PORT, "127.0.0.1", () => {
  console.error(`Undox Exposure Dashboard  http://127.0.0.1:${PORT}/`);
  console.error(`  ?session=demo-double-o-1`);
  console.error(`  API /api/session/:id  /api/sessions`);
});
