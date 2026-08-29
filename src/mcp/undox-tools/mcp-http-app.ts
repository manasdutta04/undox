/**
 * Shared Undox MCP Express app (HTTP Streamable transport).
 * Used by mcp:undox-tools:http and the public one-process deploy server.
 */

import { randomUUID, timingSafeEqual } from "node:crypto";
import type { Express, Request, Response, NextFunction } from "express";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createUndoxServer } from "./create-undox-server.js";

export type UndoxMcpAppOptions = {
  /** Bind hint for createMcpExpressApp host checks */
  host: string;
  /** Primary ops token (UNDOX_MCP_TOKEN). Empty = no auth required for this slot. */
  token: string;
  /** Additional accepted tokens (e.g. public demo token). */
  extraTokens?: string[];
  allowedHosts?: string[];
};

function tokenMatches(accepted: string[], provided: string | undefined): boolean {
  if (!accepted.length) return true;
  if (!provided) return false;
  const a = Buffer.from(provided);
  return accepted.some((token) => {
    const b = Buffer.from(token);
    return a.length === b.length && timingSafeEqual(a, b);
  });
}

function extractBearer(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const m = /^Bearer\s+(.+)$/i.exec(header.trim());
  return m?.[1]?.trim();
}

/** Build Express app with /mcp routes (auth + streamable HTTP). Does not listen. */
export function createUndoxMcpApp(opts: UndoxMcpAppOptions): Express {
  const { host, token, extraTokens = [], allowedHosts } = opts;
  const accepted = [token, ...extraTokens].map((t) => t.trim()).filter(Boolean);
  const isLoopback =
    host === "127.0.0.1" || host === "::1" || host === "localhost";

  const app = createMcpExpressApp(
    isLoopback
      ? { host: "127.0.0.1" }
      : {
          host,
          ...(allowedHosts?.length ? { allowedHosts } : {}),
        },
  );

  const transports: Record<string, StreamableHTTPServerTransport> = {};

  function requireMcpAuth(req: Request, res: Response, next: NextFunction): void {
    if (!accepted.length) {
      next();
      return;
    }
    const provided =
      extractBearer(req.header("authorization") ?? undefined) ??
      req.header("x-undox-mcp-token") ??
      undefined;
    if (!tokenMatches(accepted, provided)) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: { code: -32001, message: "Unauthorized" },
        id: null,
      });
      return;
    }
    next();
  }

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

  return app;
}
