/**
 * Configure TrueForge `undox-tool` connector with header auth matching Undox MCP.
 *
 * TrueForge schema uses auth.type: "header" (singular), not "headers".
 *
 * Env:
 *   TRUEFORGE_BASE_URL    (default http://127.0.0.1:8790)
 *   TRUEFORGE_TOKEN       (optional — Bearer for OIDC-protected TrueForge)
 *   UNDOX_MCP_TOKEN       (required — same secret MCP was started with)
 *   UNDOX_MCP_CONNECT_URL (default http://172.27.144.1:8791/mcp for WSL→Windows)
 *
 * Run: node --import tsx scripts/fix-trueforge-mcp-auth.ts
 */

const TF = process.env.TRUEFORGE_BASE_URL ?? "http://127.0.0.1:8790";
const mcpToken = (process.env.UNDOX_MCP_TOKEN ?? "").trim();
const tfToken = (process.env.TRUEFORGE_TOKEN ?? "").trim();
const url = process.env.UNDOX_MCP_CONNECT_URL ?? "http://172.27.144.1:8791/mcp";

if (!mcpToken) {
  console.error("Set UNDOX_MCP_TOKEN to the same secret the MCP process uses.");
  process.exit(1);
}

function tfHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "content-type": "application/json",
    ...(tfToken ? { Authorization: `Bearer ${tfToken}` } : {}),
    ...extra,
  };
}

const body = {
  manifest: {
    type: "remote",
    name: "undox-tool",
    url,
    description: "Undox broker find / prepare / approval-gated mock submit",
    auth: {
      type: "header",
      headers: {
        Authorization: `Bearer ${mcpToken}`,
      },
    },
  },
};

const put = await fetch(`${TF}/api/v1/settings/mcp-servers`, {
  method: "PUT",
  headers: tfHeaders(),
  body: JSON.stringify(body),
});
const putText = await put.text();
console.log("PUT", put.status);
if (!put.ok) {
  console.error(putText.slice(0, 800));
  process.exit(1);
}

const get = await fetch(`${TF}/api/v1/settings/mcp-servers`, {
  headers: tfHeaders(),
});
const parsed = (await get.json()) as {
  data: Array<{
    name: string;
    manifest: { url?: string; auth?: { type?: string } };
    auth_status: { status: string };
  }>;
};

for (const x of parsed.data ?? []) {
  console.log(
    JSON.stringify({
      name: x.name,
      url: x.manifest?.url,
      auth_type: x.manifest?.auth?.type ?? null,
      auth_status: x.auth_status?.status,
    }),
  );
}

console.log("OK — retry the undox-tool connection / chat turn in TrueForge.");
