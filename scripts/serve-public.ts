/**
 * One-process public deploy: API + fixture brokers + MCP HTTP.
 *
 *   PORT=8080 UNDOX_MCP_TOKEN=… npm run serve:public
 *
 * Paths:
 *   /api/*                session dashboard API
 *   /fixtures/...         PeopleFind / Clearbook / Spokeo HTML
 *   /mcp                  Undox MCP (Bearer required when token set)
 *   /healthz              liveness
 *   /                     optional redirect to UNDOX_WEB_URL (Vercel UI)
 */

import { existsSync, mkdirSync, readFileSync, copyFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { Request, Response, NextFunction } from "express";
import { getDashboardOrEmpty, getSessionDetailOrEmpty } from "../src/agents/dashboard-api.js";
import { listSessionIds } from "../src/mcp/undox-tools/session-store.js";
import { createUndoxMcpApp } from "../src/mcp/undox-tools/mcp-http-app.js";
import {
  DEFAULT_SESSION,
  decodeSessionId,
  publicDetailIncludesPii,
  parseCorsOrigins,
} from "./ui-site.js";

const PORT = Number(process.env.PORT ?? process.env.UNDOX_PUBLIC_PORT ?? 8080);
const HOST = process.env.HOST ?? "0.0.0.0";
const TOKEN = process.env.UNDOX_MCP_TOKEN?.trim() || "";
const WEB_URL = process.env.UNDOX_WEB_URL?.trim().replace(/\/$/, "") || "https://undox-demo.vercel.app";
const CORS_ORIGINS = parseCorsOrigins();

if (!TOKEN) {
  console.error("UNDOX_MCP_TOKEN is required for serve:public (non-loopback MCP).");
  process.exit(1);
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const FIXTURE_ROOT = resolve(ROOT, "fixtures/demo-brokers");
const SEED = resolve(ROOT, "deploy/seed-sessions.json");
const STORE =
  process.env.UNDOX_SESSION_STORE ??
  resolve(ROOT, "deploy/runtime-sessions.json");

process.env.UNDOX_SESSION_STORE = STORE;

/** Copy seed into runtime store if missing, empty, or on Render (ephemeral free-tier disk). */
function ensureSeed(): void {
  mkdirSync(dirname(STORE), { recursive: true });
  if (!existsSync(SEED)) {
    console.error("Missing deploy/seed-sessions.json — run: npm run seed:public");
    process.exit(1);
  }
  const onRender = process.env.RENDER === "true";
  const needsSeed =
    onRender ||
    !existsSync(STORE) ||
    readFileSync(STORE, "utf8").trim() === "{}";
  if (needsSeed) {
    copyFileSync(SEED, STORE);
    console.error(`Seeded session store → ${STORE}${onRender ? " (Render cold start)" : ""}`);
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

function normalizePublicUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

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

function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

app.use(corsMiddleware);

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

app.get("/api/session/:id/detail", (req, res) => {
  const sessionId = decodeSessionId(req.params.id ?? "");
  if (!sessionId) {
    res.status(400).json({ error: "Malformed session id encoding" });
    return;
  }
  res.set("cache-control", "no-store");
  res.json(getSessionDetailOrEmpty(sessionId, {
    includePii: publicDetailIncludesPii(sessionId),
  }));
});

app.get("/api/session/:id", (req, res) => {
  const sessionId = decodeSessionId(req.params.id ?? "");
  if (!sessionId) {
    res.status(400).json({ error: "Malformed session id encoding" });
    return;
  }
  res.set("cache-control", "no-store");
  res.json(getDashboardOrEmpty(sessionId));
});

app.get("/", (_req, res) => {
  res.redirect(302, `${WEB_URL}/app?session=${encodeURIComponent(DEFAULT_SESSION)}`);
});

app.get("/dashboard", (req, res) => {
  const session = (req.query.session as string | undefined) || DEFAULT_SESSION;
  res.redirect(302, `${WEB_URL}/app/exposure?session=${encodeURIComponent(session)}`);
});

/** Legacy static routes → Vercel app paths */
const LEGACY_REDIRECTS: Record<string, string> = {
  "/case": "/app/exposure",
  "/brokers": "/app/brokers",
  "/approval": "/app/approval",
  "/harness": "/app/architecture",
  "/index.html": "/app",
};
for (const [from, to] of Object.entries(LEGACY_REDIRECTS)) {
  app.get(from, (req, res) => {
    const session = (req.query.session as string | undefined) || DEFAULT_SESSION;
    res.redirect(302, `${WEB_URL}${to}?session=${encodeURIComponent(session)}`);
  });
}

app.use("/fixtures", (req, res) => {
  serveFixture(req, res);
});

app.listen(PORT, HOST, () => {
  console.error(`Undox public API on http://${HOST}:${PORT}/`);
  console.error(`  Web UI     ${WEB_URL}/app?session=${DEFAULT_SESSION}`);
  console.error(`  Fixtures   /fixtures/peoplefind/  /fixtures/clearbook/  /fixtures/spokeo/`);
  console.error(`  MCP        /mcp  (Bearer ${TOKEN ? "required" : "off"})`);
  console.error(`  Health     /healthz`);
  console.error(`  CORS       ${[...CORS_ORIGINS].join(", ")}`);
});
