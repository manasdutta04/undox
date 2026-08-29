/**
 * Shared helpers for public API (session decode, PII allowlist).
 */

export const DEFAULT_SESSION = "demo-test-2";

/** Sessions allowed to expose fixture PII on the public detail API (comma-separated env override). */
export function publicDetailSessions(): Set<string> {
  const raw =
    process.env.UNDOX_PUBLIC_DETAIL_SESSIONS?.trim() || DEFAULT_SESSION;
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean));
}

export function publicDetailIncludesPii(sessionId: string): boolean {
  return publicDetailSessions().has(sessionId);
}

export function decodeSessionId(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

/** Default CORS origins for Vercel UI + local Next dev. */
export function defaultCorsOrigins(): string[] {
  return [
    "https://undox.vercel.app",
    "https://undox-demo.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];
}

export function parseCorsOrigins(): Set<string> {
  const raw = process.env.UNDOX_CORS_ORIGINS?.trim();
  const list = raw
    ? raw.split(",").map((s) => s.trim()).filter(Boolean)
    : defaultCorsOrigins();
  return new Set(list);
}
