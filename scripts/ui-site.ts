/**
 * Shared helpers for serving the judge multi-page site.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const UI_SITE = resolve(HERE, "../src/ui/site");

export const DEFAULT_SESSION = "demo-test-2";

/** Pathname → HTML file (without leading slash). */
export const SITE_PAGES: Record<string, string> = {
  "/": "home.html",
  "/index.html": "home.html",
  "/case": "case.html",
  "/brokers": "brokers.html",
  "/approval": "approval.html",
  "/harness": "harness.html",
};

export function resolveSiteAsset(pathname: string): string | null {
  if (pathname === "/site/shared.css") return resolve(UI_SITE, "shared.css");
  if (pathname === "/site/shared.js") return resolve(UI_SITE, "shared.js");
  const page = SITE_PAGES[pathname];
  if (page) return resolve(UI_SITE, page);
  return null;
}

export function readSiteFile(pathname: string): { body: Buffer; contentType: string } | null {
  const file = resolveSiteAsset(pathname);
  if (!file || !existsSync(file)) return null;
  const ext = file.endsWith(".css") ? "text/css; charset=utf-8"
    : file.endsWith(".js") ? "text/javascript; charset=utf-8"
    : "text/html; charset=utf-8";
  return { body: readFileSync(file), contentType: ext };
}

export function decodeSessionId(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
