/**
 * Undox MCP over Streamable HTTP — what TrueForge's "Add MCP Server" UI expects.
 *
 * Local-only default: bind 127.0.0.1. For WSL→Windows reachability set:
 *   UNDOX_MCP_HOST=0.0.0.0
 *   UNDOX_MCP_TOKEN=<shared secret>
 * and configure TrueForge connector auth to send that token.
 *
 * Run:  npm run mcp:undox-tools:http
 */

import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createUndoxServer } from "./create-undox-server.js";

const PORT = Number(process.env.UNDOX_MCP_PORT ?? 8791);
const HOST = process.env.UNDOX_MCP_HOST ?? "127.0.0.1";
const TOKEN = process.env.UNDOX_MCP_TOKEN?.trim() || "";

const isLoopback =
  HOST === "127.0.0.1" || HOST === "::1" || HOST === "localhost";

if (!isLoopback && !TOKEN) {
  console.error(
    "Refusing to bind MCP on a non-loopback host without UNDOX_MCP_TOKEN. " +
      "Set a shared secret, or use UNDOX_MCP_HOST=127.0.0.1 for local-only demos.",
  );
  process.exit(1);
}

function tokenOk(provided: string | undefined): boolean {
  if (!TOKEN) return true;
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

function extractBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim();
}

function requireMcpAuth(req: Request, res: Response, next: NextFunction): void {
  if (!TOKEN) {
    next();
    return;
  }
  const provided =
    extractBearer(req.header("authorization") ?? undefined) ??
    req.header("x-undox-mcp-token") ??
    undefined;
  if (!tokenOk(provided)) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Unauthorized" },
      id: null,
    });
    return;
  }
  next();
}

// Host allowlist is optional. Non-loopback security is UNDOX_MCP_TOKEN;
// only enable DNS-rebinding Host checks when explicitly configured.
const explicitAllowedHosts = process.env.UNDOX_MCP_ALLOWED_HOSTS?.split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const app = createMcpExpressApp(
  isLoopback
    ? { host: "127.0.0.1" }
    : {
        host: HOST,
        ...(explicitAllowedHosts?.length
          ? { allowedHosts: explicitAllowedHosts }
          : {}),
      },
);
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.use("/mcp", requireMcpAuth);

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          transports[id] = transport;
        },
      });
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) delete transports[sid];
      };
      const server = createUndoxServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } else {
      res.status(400).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Bad Request: No valid session ID provided" },
        id: null,
      });
      return;
    }

    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP POST error:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }
  await transports[sessionId].handleRequest(req, res);
});

app.listen(PORT, HOST, () => {
  const connectUrl =
    process.env.UNDOX_MCP_CONNECT_URL ?? `http://127.0.0.1:${PORT}/mcp`;
  console.error(`undox-tools MCP (HTTP) bound on ${HOST}:${PORT}`);
  console.error("Keep this terminal open. TrueForge → Settings → Connectors:");
  console.error(`  Name: ${process.env.UNDOX_MCP_NAME ?? "undox-tool"}`);
  console.error(`  URL:  ${connectUrl}`);
  console.error(`  Auth: ${TOKEN ? "Bearer / x-undox-mcp-token (UNDOX_MCP_TOKEN set)" : "None (loopback only)"}`);
  if (!isLoopback) {
    console.error(
      "  Non-loopback bind requires UNDOX_MCP_TOKEN." +
        (explicitAllowedHosts?.length
          ? ` Host allowlist: ${explicitAllowedHosts.join(", ")}`
          : " Optional: set UNDOX_MCP_ALLOWED_HOSTS only if you want Host-header checks."),
    );
  }
});
