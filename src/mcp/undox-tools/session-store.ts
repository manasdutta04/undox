import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  BrokerId,
  ListingStatus,
  OptOutSubmission,
  PiiPayload,
  SessionBrokerState,
  UndoxSessionState,
} from "../../agents/types.js";

const DEFAULT_STORE = resolve(process.cwd(), ".undox-session-state.json");

function storePath(): string {
  return resolve(process.env.UNDOX_SESSION_STORE ?? DEFAULT_STORE);
}

function emptySession(sessionId: string, person: PiiPayload): UndoxSessionState {
  return {
    sessionId,
    person,
    brokers: [],
    timeline: [{ at: new Date().toISOString(), event: "session.created" }],
  };
}

export function loadSession(sessionId: string, person?: PiiPayload): UndoxSessionState {
  const path = storePath();
  if (!existsSync(path)) {
    if (!person) {
      throw new Error(`No session store at ${path} and no person provided`);
    }
    return emptySession(sessionId, person);
  }
  const all = JSON.parse(readFileSync(path, "utf8")) as Record<string, UndoxSessionState>;
  const existing = all[sessionId];
  if (existing) return existing;
  if (!person) {
    const known = Object.keys(all);
    const hint = suggestSessionIds(sessionId, known);
    throw new Error(
      `Session ${JSON.stringify(sessionId)} not found.` +
        (hint ? ` Did you mean ${hint}?` : known.length ? ` Known ids: ${known.slice(-8).join(", ")}` : ""),
    );
  }
  return emptySession(sessionId, person);
}

/** Prefer ids that share a prefix with the (possibly truncated) query. */
function suggestSessionIds(query: string, known: string[]): string | null {
  const q = query.trim();
  if (!q) return null;
  const prefixHits = known.filter((id) => id.startsWith(q) && id !== q);
  const ranked = (prefixHits.length ? prefixHits : known.filter((id) => id.includes(q) || q.includes(id))).slice();
  ranked.sort((a, b) => {
    // Prefer demo-* live/double-o style ids, then shorter completions
    const score = (id: string) => {
      let s = 0;
      if (/-live-\d+$/i.test(id) || /double-o/i.test(id)) s += 20;
      if (/^demo-[a-z]+-\d+$/i.test(id)) s += 10;
      s -= Math.min(id.length, 40);
      return s;
    };
    return score(b) - score(a) || a.localeCompare(b);
  });
  return ranked.length ? ranked.slice(0, 6).join(", ") : null;
}

export function saveSession(state: UndoxSessionState): void {
  const path = storePath();
  mkdirSync(dirname(path), { recursive: true });
  const all = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, UndoxSessionState>)
    : {};
  all[state.sessionId] = state;
  writeFileSync(path, JSON.stringify(all, null, 2), "utf8");
}

/** List session ids currently persisted in the store (dashboard picker). */
export function listSessionIds(): string[] {
  const path = storePath();
  if (!existsSync(path)) return [];
  try {
    const raw = readFileSync(path, "utf8");
    const all = JSON.parse(raw) as Record<string, UndoxSessionState>;
    if (!all || typeof all !== "object" || Array.isArray(all)) return [];
    return Object.keys(all).sort();
  } catch {
    return [];
  }
}

/** Load session or null if missing (dashboard API — never throw for UI poll). */
export function tryLoadSession(sessionId: string): UndoxSessionState | null {
  try {
    return loadSession(sessionId);
  } catch {
    return null;
  }
}

export function upsertBrokerStatus(
  state: UndoxSessionState,
  broker: BrokerId,
  status: ListingStatus,
  patch: Partial<SessionBrokerState> = {},
): UndoxSessionState {
  const now = new Date().toISOString();
  const idx = state.brokers.findIndex((b) => b.broker === broker);
  const next: SessionBrokerState = {
    ...(idx >= 0 ? state.brokers[idx] : {}),
    ...patch,
    // status/broker/updatedAt must win over any stale fields from the spread above
    broker,
    status,
    updatedAt: now,
  };
  const brokers = [...state.brokers];
  if (idx >= 0) brokers[idx] = next;
  else brokers.push(next);
  state.brokers = brokers;
  state.timeline.push({
    at: now,
    event: `broker.${status}`,
    detail: broker,
  });
  saveSession(state);
  return state;
}

export function markSubmitted(
  state: UndoxSessionState,
  submission: OptOutSubmission,
  note: string,
): UndoxSessionState {
  return upsertBrokerStatus(state, submission.broker, "submitted", {
    listing: submission.listing,
    lastSubmission: submission,
    notes: note,
  });
}
