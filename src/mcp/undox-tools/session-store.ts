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
    throw new Error(`Session ${sessionId} not found`);
  }
  return emptySession(sessionId, person);
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
