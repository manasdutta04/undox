/**
 * Undox MCP over Streamable HTTP — what TrueForge's "Add MCP Server" UI expects.
 *
 * Local-only default: bind 127.0.0.1. For WSL→Windows / public deploy set:
 *   UNDOX_MCP_HOST=0.0.0.0
 *   UNDOX_MCP_TOKEN=<shared secret>
 *
 * Run:  npm run mcp:undox-tools:http
 */

import { createUndoxMcpApp } from "./mcp-http-app.js";

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

const explicitAllowedHosts = process.env.UNDOX_MCP_ALLOWED_HOSTS?.split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const app = createUndoxMcpApp({
  host: HOST,
  token: TOKEN,
  ...(explicitAllowedHosts?.length ? { allowedHosts: explicitAllowedHosts } : {}),
});

app.listen(PORT, HOST, () => {
  const connectUrl =
    process.env.UNDOX_MCP_CONNECT_URL ?? `http://127.0.0.1:${PORT}/mcp`;
  console.error(`undox-tools MCP (HTTP) bound on ${HOST}:${PORT}`);
  console.error("Keep this terminal open. TrueForge → Settings → Connectors:");
  console.error(`  Name: ${process.env.UNDOX_MCP_NAME ?? "undox-tool"}`);
  console.error(`  URL:  ${connectUrl}`);
  console.error(
    `  Auth: ${TOKEN ? "Bearer / x-undox-mcp-token (UNDOX_MCP_TOKEN set)" : "None (loopback only)"}`,
  );
  if (!isLoopback) {
    console.error(
      "  Non-loopback bind requires UNDOX_MCP_TOKEN." +
        (explicitAllowedHosts?.length
          ? ` Host allowlist: ${explicitAllowedHosts.join(", ")}`
          : " Optional: set UNDOX_MCP_ALLOWED_HOSTS only if you want Host-header checks."),
    );
  }
});
