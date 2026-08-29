export const GITHUB_REPO = "https://github.com/manasdutta04/undox";
export const DEFAULT_SESSION = "demo-test-2";

export const APP_NAV = [
  { href: "/app", label: "Overview" },
  { href: "/app/exposure", label: "Exposure" },
  { href: "/app/brokers", label: "Brokers" },
  { href: "/app/approval", label: "Approval" },
  { href: "/app/architecture", label: "Architecture" },
] as const;

export const VERCEL_APP_URL = "https://undox-demo.vercel.app";

export function withSession(href: string, session?: string | null): string {
  const id = session?.trim() || DEFAULT_SESSION;
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set("session", id);
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
