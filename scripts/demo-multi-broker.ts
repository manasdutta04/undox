/**
 * Multi-broker offline demo — find → sandbox prepare → approval payloads → mock submit → dashboard.
 * Usage: npm run demo:multi-broker
 */

import { prepareSpokeoOptOut } from "../src/sandbox/spokeo-prepare-optout.js";
import { preparePeoplefindOptOut } from "../src/sandbox/peoplefind-prepare-optout.js";
import { prepareClearbookOptOut } from "../src/sandbox/clearbook-prepare-optout.js";
import { buildExposureDashboard } from "../src/agents/exposure-dashboard.js";
import type { BrokerId, BrokerListing, PiiPayload } from "../src/agents/types.js";
import {
  loadSession,
  markSubmitted,
  upsertBrokerStatus,
} from "../src/mcp/undox-tools/session-store.js";

const sessionId = process.env.DEMO_SESSION_ID ?? `demo-multi-${Date.now()}`;

const person: PiiPayload = {
  name: process.env.DEMO_FULL_NAME ?? "Alex Rivera",
  address: process.env.DEMO_ADDRESS ?? "123 Maple Ave, Austin, TX 78701",
  phone: process.env.DEMO_PHONE ?? "+1-512-555-0142",
  dob: process.env.DEMO_DOB ?? "1990-04-12",
  email: process.env.DEMO_EMAIL ?? "alex.rivera.optout@example.com",
};

const base = (process.env.UNDOX_FIXTURE_BASE_URL ?? "http://127.0.0.1:8792").replace(/\/$/, "");

const listings: Record<BrokerId, BrokerListing> = {
  spokeo: {
    broker: "spokeo",
    profileUrl: "https://www.spokeo.com/Alex-Rivera/TX/Austin/p-fixture-alex-rivera",
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  },
  peoplefind: {
    broker: "peoplefind",
    profileUrl: `${base}/peoplefind/profile.html?name=${encodeURIComponent(person.name)}`,
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  },
  clearbook: {
    broker: "clearbook",
    profileUrl: `${base}/clearbook/profile.html?q=${encodeURIComponent(person.name)}`,
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  },
};

console.log("=== Undox multi-broker demo (no LLM) ===");
console.log("session_id:", sessionId);

let state = loadSession(sessionId, person);

for (const broker of Object.keys(listings) as BrokerId[]) {
  const listing = listings[broker];
  state = upsertBrokerStatus(state, broker, "found", { listing });
  const submission =
    broker === "spokeo"
      ? prepareSpokeoOptOut({ person, listing, mode: "mock" })
      : broker === "peoplefind"
        ? preparePeoplefindOptOut({ person, listing, mode: "mock" })
        : prepareClearbookOptOut({ person, listing, mode: "mock" });
  submission.prepareRuntime = "sandbox-script";
  state = upsertBrokerStatus(state, broker, "prepared", {
    listing,
    lastSubmission: submission,
  });
  console.log(`\nAPPROVAL (${broker}) — exact PII:`);
  console.log(JSON.stringify({ broker, pii: submission.pii, form: submission.formFields }, null, 2));
  state = markSubmitted(state, submission, `Mock submit ${broker} from demo:multi-broker`);
}

const dash = buildExposureDashboard(state);
console.log("\n=== Exposure dashboard ===");
console.log(JSON.stringify(dash, null, 2));
console.log("\nResume beat: reuse session_id", sessionId, "after restart.");
