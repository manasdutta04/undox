/**
 * Offline heart proof: multi-broker mock flow + disk resume (no LLM / TrueForge).
 * Run: npm run prove:heart
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareSpokeoOptOut } from "../src/sandbox/spokeo-prepare-optout.js";
import { preparePeoplefindOptOut } from "../src/sandbox/peoplefind-prepare-optout.js";
import { prepareClearbookOptOut } from "../src/sandbox/clearbook-prepare-optout.js";
import { buildExposureDashboard } from "../src/agents/exposure-dashboard.js";
import {
  loadSession,
  markSubmitted,
  upsertBrokerStatus,
} from "../src/mcp/undox-tools/session-store.js";
import type { BrokerId, BrokerListing, PiiPayload } from "../src/agents/types.js";

const person: PiiPayload = {
  name: "Alex Rivera",
  address: "123 Maple Ave Austin TX 78701",
  phone: "+1-512-555-0142",
  dob: "1990-04-12",
  email: "alex.rivera.optout@example.com",
};

const listings: Record<BrokerId, BrokerListing> = {
  spokeo: {
    broker: "spokeo",
    profileUrl: "https://www.spokeo.com/alex-rivera/p-fx",
    matchedName: person.name,
    source: "fixture",
  },
  peoplefind: {
    broker: "peoplefind",
    profileUrl: "http://127.0.0.1:8792/peoplefind/profile.html?name=Alex%20Rivera",
    matchedName: person.name,
    source: "fixture",
  },
  clearbook: {
    broker: "clearbook",
    profileUrl: "http://127.0.0.1:8792/clearbook/profile.html?q=Alex%20Rivera",
    matchedName: person.name,
    source: "fixture",
  },
};

const dir = mkdtempSync(join(tmpdir(), "undox-prove-"));
const storePath = join(dir, "state.json");
process.env.UNDOX_SESSION_STORE = storePath;

const sessionId = `prove-heart-${Date.now()}`;
let state = loadSession(sessionId, person);

for (const broker of ["spokeo", "peoplefind", "clearbook"] as BrokerId[]) {
  const listing = listings[broker];
  state = upsertBrokerStatus(state, broker, "found", { listing });
  const prepared =
    broker === "spokeo"
      ? prepareSpokeoOptOut({ person, listing })
      : broker === "peoplefind"
        ? preparePeoplefindOptOut({ person, listing })
        : prepareClearbookOptOut({ person, listing });
  prepared.prepareRuntime = "sandbox-script";
  state = upsertBrokerStatus(state, broker, "prepared", {
    listing,
    lastSubmission: prepared,
  });
  state = markSubmitted(state, { ...prepared, mode: "mock" }, "prove-heart mock");
}

// Simulate kill TrueForge: only disk store remains
const reloaded = loadSession(sessionId);
const dash = buildExposureDashboard(reloaded);
const statuses = dash.brokers.map((b) => `${b.broker}:${b.status}`).join(", ");

console.log("=== prove:heart ===");
console.log("session_id:", sessionId);
console.log("brokers:", statuses);
console.log("risk:", dash.riskLabel, dash.riskScore);
console.log("summary:", dash.summary);

const allSubmitted = dash.brokers.every((b) => b.status === "submitted");
const three = dash.brokers.length === 3;

rmSync(dir, { recursive: true, force: true });

if (!allSubmitted || !three) {
  console.error("FAIL: expected 3 submitted brokers after disk resume");
  process.exit(1);
}
console.log("OK — heart loop + kill/resume (disk) passed.");
