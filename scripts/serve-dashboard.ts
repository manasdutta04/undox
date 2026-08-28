/**
 * Local judge site + API for development.
 * Run: npm run dashboard:serve → http://127.0.0.1:8793/case?session=demo-test-2
 */

import { createServer } from "node:http";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDashboardOrEmpty, getSessionDetailOrEmpty } from "../src/agents/dashboard-api.js";
import { listSessionIds } from "../src/mcp/undox-tools/session-store.js";
import {
  DEFAULT_SESSION,
  readSiteFile,
  decodeSessionId,
} from "./ui-site.js";

const PORT = Number(process.env.UNDOX_DASHBOARD_PORT ?? 8793);
const HERE = dirname(fileURLToPath(import.meta.url));

function json(res: import("node:http").ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendSite(
  res: import("node:http").ServerResponse,
  pathname: string,
): boolean {
  const file = readSiteFile(pathname);
  if (!file) return false;
  res.writeHead(200, { "content-type": file.contentType, "cache-control": "no-store" });
  res.end(file.body);
  return true;
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

  const detailMatch = url.pathname.match(/^\/api\/session\/([^/]+)\/detail$/);
  if (detailMatch) {
    const sessionId = decodeSessionId(detailMatch[1]!);
    if (!sessionId) {
      json(res, 400, { error: "Malformed session id encoding" });
      return;
    }
    json(res, 200, getSessionDetailOrEmpty(sessionId));
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

  if (url.pathname === "/dashboard") {
    res.writeHead(302, {
      location: `/case?session=${encodeURIComponent(url.searchParams.get("session") || DEFAULT_SESSION)}`,
    });
    res.end();
    return;
  }

  if (sendSite(res, url.pathname)) return;

  res.writeHead(404, { "content-type": "text/plain" });
  res.end("Not found");
}).listen(PORT, "127.0.0.1", () => {
  console.error(`Undox judge site  http://127.0.0.1:${PORT}/`);
  console.error(`  /case?session=${DEFAULT_SESSION}`);
  console.error(`  API /api/session/:id  /api/session/:id/detail`);
});
