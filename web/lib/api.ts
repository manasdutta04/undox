import type { SessionDashboard, SessionDetail } from "./types";

/**
 * Browser uses same-origin `/backend/*` (Next rewrites → Render).
 * Set NEXT_PUBLIC_UNDOX_USE_DIRECT_API=1 to hit NEXT_PUBLIC_UNDOX_API_URL directly.
 */
export function apiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_UNDOX_API_URL?.trim().replace(/\/$/, "");
  if (typeof window !== "undefined") {
    if (process.env.NEXT_PUBLIC_UNDOX_USE_DIRECT_API === "1" && explicit) return explicit;
    return "/backend";
  }
  if (explicit) return explicit;
  return "http://127.0.0.1:8080";
}

export function resolveFixtureUrl(raw: string | undefined): string {
  if (!raw) return "";
  const t = raw.trim();
  if (t.startsWith("/")) {
    const base = apiBase();
    try {
      if (base === "/backend") {
        const origin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:3000";
        return new URL(`/backend${t}`, origin).href;
      }
      return new URL(t, base || (typeof window !== "undefined" ? window.location.origin : "")).href;
    } catch {
      return "";
    }
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.href;
  } catch {
    return "";
  }
}

export async function getSession(sessionId: string): Promise<SessionDashboard> {
  const res = await fetch(`${apiBase()}/api/session/${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Session fetch failed: ${res.status}`);
  return res.json();
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  const res = await fetch(`${apiBase()}/api/session/${encodeURIComponent(sessionId)}/detail`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Detail fetch failed: ${res.status}`);
  return res.json();
}

export async function listSessions(): Promise<string[]> {
  const res = await fetch(`${apiBase()}/api/sessions`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { sessions?: string[] };
  return data.sessions ?? [];
}
