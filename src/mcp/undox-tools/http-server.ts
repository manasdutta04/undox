/**
 * Undox MCP over Streamable HTTP — what TrueForge's "Add MCP Server" UI expects.
 *
 * Run:  npm run mcp:undox-tools:http
 * URL:  http://127.0.0.1:8791/mcp
 * Auth: None
 */

import { randomUUID } from "node:crypto";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createUndoxServer } from "./create-undox-server.js";

const PORT = Number(process.env.UNDOX_MCP_PORT ?? 8791);
// Bind all interfaces so TrueForge in WSL can reach a Windows-hosted MCP.
const HOST = process.env.UNDOX_MCP_HOST ?? "0.0.0.0";

// No allowedHosts list: Host header may be 127.0.0.1 (mirrored) or the Windows
// host IP from WSL. Fine for local hackathon use only.
const app = createMcpExpressApp({ host: HOST });
const transports: Record<string, StreamableHTTPServerTransport> = {};

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
  // Bind host may be 0.0.0.0; TrueForge must use a real reachability URL.
  const connectUrl =
    process.env.UNDOX_MCP_CONNECT_URL ?? `http://127.0.0.1:${PORT}/mcp`;
  console.error(`undox-tools MCP (HTTP) bound on ${HOST}:${PORT}`);
  console.error("Keep this terminal open. TrueForge → Settings → Connectors:");
  console.error(`  Name: ${process.env.UNDOX_MCP_NAME ?? "undox-tool"}`);
  console.error(`  URL:  ${connectUrl}`);
  console.error("  Auth: None");
  console.error("  (From WSL TrueForge use Windows host IP, not 0.0.0.0 / not 127.0.0.1)");
});
