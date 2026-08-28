/**
 * One-process public deploy: Exposure Dashboard + fixture brokers + MCP HTTP.
 *
 *   PORT=8080 UNDOX_MCP_TOKEN=… npm run serve:public
 *
 * Paths:
 *   /                     dashboard UI
 *   /api/session/:id      dashboard API
 *   /fixtures/...         PeopleFind / Clearbook HTML
 *   /mcp                  Undox MCP (Bearer required when token set)
 *   /healthz              liveness
 */

import { existsSync, mkdirSync, readFileSync, copyFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response } from "express";
import { getDashboardOrEmpty } from "../src/agents/dashboard-api.js";
import { listSessionIds } from "../src/mcp/undox-tools/session-store.js";
import { createUndoxMcpApp } from "../src/mcp/undox-tools/mcp-http-app.js";

const PORT = Number(process.env.PORT ?? process.env.UNDOX_PUBLIC_PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";
const TOKEN = process.env.UNDOX_MCP_TOKEN?.trim() || "";

if (!TOKEN) {
  console.error("UNDOX_MCP_TOKEN is required for serve:public (non-loopback MCP).");
  process.exit(1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const PAGE = resolve(ROOT, "src/ui/dashboard/index.html");
const FIXTURE_ROOT = resolve(ROOT, "fixtures/demo-brokers");
const SEED = resolve(ROOT, "deploy/seed-sessions.json");
const STORE =
  process.env.UNDOX_SESSION_STORE ??
  resolve(ROOT, "deploy/runtime-sessions.json");

process.env.UNDOX_SESSION_STORE = STORE;

/** Copy seed into runtime store if missing or empty. */
function ensureSeed(): void {
  mkdirSync(dirname(STORE), { recursive: true });
  if (!existsSync(SEED)) {
    console.error("Missing deploy/seed-sessions.json — run: npm run seed:public");
    process.exit(1);
  }
  if (!existsSync(STORE) || readFileSync(STORE, "utf8").trim() === "{}") {
    copyFileSync(SEED, STORE);
    console.error(`Seeded session store → ${STORE}`);
  }
}

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
};

function fsUnderRoot(urlPath: string): string {
  const trimmed = urlPath.replace(/^\/+/, "").replace(/\/+$/, "");
  return trimmed ? normalize(join(FIXTURE_ROOT, ...trimmed.split("/"))) : FIXTURE_ROOT;
}

function isSafeFile(target: string): boolean {
  const rootWithSep = FIXTURE_ROOT.endsWith(sep) ? FIXTURE_ROOT : FIXTURE_ROOT + sep;
  return (
    (target === FIXTURE_ROOT || target.startsWith(rootWithSep)) &&
    existsSync(target) &&
    statSync(target).isFile()
  );
}

function serveFixture(req: Request, res: Response): void {
  // Mounted at /fixtures — Express gives path relative to mount (e.g. /peoplefind/)
  const rawUrl = req.url ?? "/";
  const qIdx = rawUrl.indexOf("?");
  const pathOnly = qIdx >= 0 ? rawUrl.slice(0, qIdx) : rawUrl;
  const query = qIdx >= 0 ? rawUrl.slice(qIdx) : "";

  let urlPath: string;
  try {
    urlPath = decodeURIComponent(pathOnly || "/");
  } catch {
    res.status(400).type("text").send("Bad request");
    return;
  }

  if (!urlPath.startsWith("/")) urlPath = `/${urlPath}`;

  if (urlPath !== "/" && !urlPath.endsWith("/")) {
    const asDir = fsUnderRoot(urlPath);
    if (existsSync(asDir) && statSync(asDir).isDirectory()) {
      res.redirect(301, `/fixtures${urlPath}/${query}`);
      return;
    }
  }

  let fileRel: string;
  if (urlPath === "/" || urlPath.endsWith("/")) {
    fileRel = `${urlPath}index.html`.replace(/\/+/g, "/");
  } else {
    fileRel = urlPath;
  }

  const target = fsUnderRoot(fileRel);
  if (!isSafeFile(target)) {
    res.status(404).type("text").send("Not found");
    return;
  }
  res.type(TYPES[extname(target)] ?? "application/octet-stream").send(readFileSync(target));
}

ensureSeed();

/** Ensure public URL has a scheme (Render host-only values need https://). */
function normalizePublicUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/** Render / Fly public URL when UNDOX_PUBLIC_URL is not set explicitly. */
function resolvePublicUrl(): string | undefined {
  const explicit = process.env.UNDOX_PUBLIC_URL?.trim();
  if (explicit) return normalizePublicUrl(explicit);
  const render = process.env.RENDER_EXTERNAL_URL?.trim();
  return render ? normalizePublicUrl(render) : undefined;
}

const publicUrl = resolvePublicUrl();
if (publicUrl && !process.env.UNDOX_PUBLIC_URL) {
  process.env.UNDOX_PUBLIC_URL = publicUrl;
}

// Public fixture base for MCP prepare tools that mint listing URLs.
if (!process.env.UNDOX_FIXTURE_BASE_URL) {
  process.env.UNDOX_FIXTURE_BASE_URL = publicUrl
    ? `${publicUrl}/fixtures`
    : `http://127.0.0.1:${PORT}/fixtures`;
}

const envAllowedHosts = process.env.UNDOX_MCP_ALLOWED_HOSTS?.split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const renderHostname = process.env.RENDER_EXTERNAL_HOSTNAME?.trim();
const allowedHosts =
  envAllowedHosts?.length
    ? envAllowedHosts
    : renderHostname
      ? [renderHostname]
      : undefined;

const app = createUndoxMcpApp({
  host: HOST,
  token: TOKEN,
  ...(allowedHosts?.length ? { allowedHosts } : {}),
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "undox-public" });
});

app.get("/api/sessions", (_req, res) => {
  try {
    res.set("cache-control", "no-store");
    res.json({ sessions: listSessionIds() });
  } catch (err) {
    res.status(500).json({ error: "Failed to read session store", detail: String(err) });
  }
});

app.get("/api/session/:id", (req, res) => {
  let sessionId: string;
  try {
    sessionId = decodeURIComponent(req.params.id ?? "");
  } catch {
    res.status(400).json({ error: "Malformed session id encoding" });
    return;
  }
  res.set("cache-control", "no-store");
  res.json(getDashboardOrEmpty(sessionId));
});

app.use("/fixtures", (req, res) => {
  serveFixture(req, res);
});

app.get(["/", "/index.html"], (_req, res) => {
  if (!existsSync(PAGE)) {
    res.status(500).type("text").send("Missing dashboard HTML");
    return;
  }
  res.set("cache-control", "no-store");
  res.type("html").send(readFileSync(PAGE));
});

app.listen(PORT, HOST, () => {
  console.error(`Undox public demo on http://${HOST}:${PORT}/`);
  console.error(`  Dashboard  /?session=demo-test-2`);
  console.error(`  Fixtures   /fixtures/peoplefind/  /fixtures/clearbook/`);
  console.error(`  MCP        /mcp  (Bearer ${TOKEN ? "required" : "off"})`);
  console.error(`  Health     /healthz`);
});
