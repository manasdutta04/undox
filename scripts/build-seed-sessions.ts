import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const storePath = resolve(process.cwd(), ".undox-session-state.json");
if (!existsSync(storePath)) {
  console.error("Missing .undox-session-state.json — run a demo session first");
  process.exit(1);
}

const all = JSON.parse(readFileSync(storePath, "utf8")) as Record<string, unknown>;
const raw = all["demo-test-2"] as {
  sessionId: string;
  brokers: Array<{
    listing?: { profileUrl?: string };
    lastSubmission?: {
      optOutUrl?: string;
      listing?: { profileUrl?: string };
      formFields?: Record<string, string>;
    };
  }>;
} | undefined;

if (!raw) {
  console.error("demo-test-2 not in session store");
  process.exit(1);
}

/** Same-origin fixture paths so the public dashboard can resolve them (see safeHttpUrl). */
function rewrite(u: string | undefined): string | undefined {
  if (!u) return u;
  return u
    .replaceAll("http://127.0.0.1:8792", "/fixtures")
    .replaceAll("http://localhost:8792", "/fixtures");
}

for (const b of raw.brokers) {
  if (b.listing?.profileUrl) b.listing.profileUrl = rewrite(b.listing.profileUrl)!;
  if (b.lastSubmission?.listing?.profileUrl) {
    b.lastSubmission.listing.profileUrl = rewrite(b.lastSubmission.listing.profileUrl)!;
  }
  if (b.lastSubmission?.optOutUrl) {
    b.lastSubmission.optOutUrl = rewrite(b.lastSubmission.optOutUrl)!;
  }
  if (b.lastSubmission?.formFields) {
    for (const [k, v] of Object.entries(b.lastSubmission.formFields)) {
      b.lastSubmission.formFields[k] = rewrite(v) ?? v;
    }
  }
}

mkdirSync(resolve("deploy"), { recursive: true });
const outPath = resolve("deploy/seed-sessions.json");
writeFileSync(outPath, JSON.stringify({ "demo-test-2": raw }, null, 2), "utf8");
console.log("Wrote", outPath);
