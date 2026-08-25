/**
 * Local demo of the PR1 approval-gate contract — no LLM required.
 *
 * Runs: find → prepare → prints the exact PII payload that TrueForge would
 * show in the approval modal → mock submit → prints session state.
 *
 * Usage: npm run demo:approval-gate
 */

import { prepareSpokeoOptOut } from "../src/sandbox/spokeo-prepare-optout.js";
import type { BrokerListing, PiiPayload } from "../src/agents/types.js";
import {
  loadSession,
  markSubmitted,
  upsertBrokerStatus,
} from "../src/mcp/undox-tools/session-store.js";

const sessionId = `demo-${Date.now()}`;

const person: PiiPayload = {
  name: process.env.DEMO_FULL_NAME ?? "Alex Rivera",
  address: process.env.DEMO_ADDRESS ?? "123 Maple Ave, Austin, TX 78701",
  phone: process.env.DEMO_PHONE ?? "+1-512-555-0142",
  dob: process.env.DEMO_DOB ?? "1990-04-12",
  email: process.env.DEMO_EMAIL ?? "alex.rivera.optout@example.com",
};

const listing: BrokerListing = {
  broker: "spokeo",
  profileUrl: "https://www.spokeo.com/Alex-Rivera/TX/Austin/p-fixture-alex-rivera",
  matchedName: person.name,
  matchedLocation: "Austin, TX",
  source: "fixture",
};

console.log("=== Undox PR1 approval-gate demo (no LLM) ===\n");
console.log("1) find_broker_listing → fixture Spokeo URL");
let state = loadSession(sessionId, person);
state = upsertBrokerStatus(state, "spokeo", "found", { listing });
console.log("   ", listing.profileUrl);

console.log("\n2) prepare_opt_out / sandbox script → form + PII");
const submission = prepareSpokeoOptOut({ person, listing, mode: "mock" });
state = upsertBrokerStatus(state, "spokeo", "prepared", {
  listing,
  lastSubmission: submission,
});

console.log("\n3) APPROVAL GATE — exact PII payload TrueForge must show:");
console.log("────────────────────────────────────────");
console.log(
  JSON.stringify(
    {
      tool: "submit_opt_out",
      broker: "spokeo",
      opt_out_url: submission.optOutUrl,
      profile_url: listing.profileUrl,
      name: submission.pii.name,
      address: submission.pii.address,
      phone: submission.pii.phone,
      dob: submission.pii.dob,
      email: submission.pii.email,
      form_fields: submission.formFields,
      mode: "mock",
    },
    null,
    2,
  ),
);
console.log("────────────────────────────────────────");
console.log("Human chooses Allow / Deny here (in TrueForge chat UI).\n");

console.log("4) On Allow → mock submit (no live HTTP POST)");
state = markSubmitted(
  state,
  submission,
  "PR1 mock submit from demo:approval-gate",
);

console.log("\n5) Session state:");
console.log(JSON.stringify(state, null, 2));
console.log("\nDone. Wire the same tools through TrueForge to see the real approval pause.");
