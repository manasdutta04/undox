/**
 * Local session API for development (UI: cd web && npm run dev).
 * Run: npm run dashboard:serve → http://127.0.0.1:8793/api/sessions
 */

import { createServer } from "node:http";
import { getDashboardOrEmpty, getSessionDetailOrEmpty } from "../src/agents/dashboard-api.js";
import { listSessionIds } from "../src/mcp/undox-tools/session-store.js";
import { decodeSessionId, parseCorsOrigins, publicDetailIncludesPii } from "./ui-site.js";

const PORT = Number(process.env.UNDOX_DASHBOARD_PORT ?? 8793);
const CORS_ORIGINS = parseCorsOrigins();

function json(res: import("node:http").ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function applyCors(req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse): boolean {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
}

createServer((req, res) => {
  if (applyCors(req, res)) return;

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

  const detailMatch = url.pathname.match(/^\/api\/session\/([^/]+)\/detail$/);
  if (detailMatch) {
    const sessionId = decodeSessionId(detailMatch[1]!);
    if (!sessionId) {
      json(res, 400, { error: "Malformed session id encoding" });
      return;
    }
    json(res, 200, getSessionDetailOrEmpty(sessionId, {
      includePii: publicDetailIncludesPii(sessionId),
    }));
    return;
  }

  const sessionMatch = url.pathname.match(/^\/api\/session\/([^/]+)$/);
  if (sessionMatch) {
    const sessionId = decodeSessionId(sessionMatch[1]!);
    if (!sessionId) {
      json(res, 400, { error: "Malformed session id encoding" });
      return;
    }
    json(res, 200, getDashboardOrEmpty(sessionId));
    return;
  }

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("API only — run Next UI: cd web && npm run dev");
}).listen(PORT, "127.0.0.1", () => {
  console.error(`Undox local API  http://127.0.0.1:${PORT}/api/sessions`);
  console.error(`  Next UI: cd web && NEXT_PUBLIC_UNDOX_API_URL=http://127.0.0.1:${PORT} npm run dev`);
});
