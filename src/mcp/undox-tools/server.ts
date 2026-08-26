/**
 * Undox MCP over stdio (optional / local tooling).
 * TrueForge UI expects the HTTP server — use `npm run mcp:undox-tools:http`.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createUndoxServer } from "./create-undox-server.js";

async function main() {
  const server = createUndoxServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("undox-tools MCP server listening on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
