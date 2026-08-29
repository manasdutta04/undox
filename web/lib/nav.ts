export const GITHUB_REPO = "https://github.com/manasdutta04/undox";
export const DEFAULT_SESSION = "demo-test-2";
export const MCP_URL = "https://undox-demo.onrender.com/mcp";
export const API_PUBLIC_URL = "https://undox-demo.onrender.com";
export const VERCEL_APP_URL = "https://undox-demo.vercel.app";

export const APP_NAV = [
  { href: "/app", label: "Overview" },
  { href: "/app/exposure", label: "Exposure" },
  { href: "/app/brokers", label: "Brokers" },
  { href: "/app/approval", label: "Approval" },
  { href: "/app/architecture", label: "Architecture" },
  { href: "/app/connect", label: "Connect" },
] as const;

export function withSession(href: string, session?: string | null): string {
  const id = session?.trim() || DEFAULT_SESSION;
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("session", id);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** TrueForge MCP connector JSON (Bearer token filled by operator). */
export function trueforgeMcpSnippet(token = "YOUR_UNDOX_MCP_TOKEN"): string {
  return JSON.stringify(
    {
      name: "undox-tools",
      url: MCP_URL,
      auth: {
        type: "header",
        header: "Authorization",
        value: `Bearer ${token}`,
      },
    },
    null,
    2,
  );
}
