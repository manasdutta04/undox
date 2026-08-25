/**
 * Spokeo opt-out prepare step — the script the agent runs in the Daytona sandbox
 * (or locally via `npm run sandbox:spokeo-prepare` / the MCP prepare tool).
 *
 * PR1: builds the exact form payload and NEVER submits. Submission is gated
 * behind the `submit_opt_out` MCP tool, which TrueForge pauses for approval.
 */

import type { BrokerListing, OptOutSubmission, PiiPayload } from "../agents/types.js";

export const SPOKEO_OPT_OUT_URL = "https://www.spokeo.com/optout";

export interface PrepareInput {
  person: PiiPayload;
  listing: BrokerListing;
  mode?: "mock" | "live";
}

/**
 * Map person + listing → the fields Spokeo's opt-out form expects.
 * Spokeo primarily wants the listing URL + contact email; we still carry the
 * full PII payload so the approval gate can show name/address/phone/DOB.
 */
export function prepareSpokeoOptOut(input: PrepareInput): OptOutSubmission {
  const { person, listing } = input;
  if (listing.broker !== "spokeo") {
    throw new Error(`prepareSpokeoOptOut only handles spokeo, got ${listing.broker}`);
  }
  if (!listing.profileUrl.includes("spokeo.com")) {
    throw new Error(`Expected a Spokeo profile URL, got: ${listing.profileUrl}`);
  }

  return {
    broker: "spokeo",
    optOutUrl: SPOKEO_OPT_OUT_URL,
    listing,
    pii: { ...person },
    formFields: {
      // Spokeo form fields (PR1 mapping — live POST comes in a later PR)
      profile_url: listing.profileUrl,
      email: person.email,
      // Carried for the approval UI even though Spokeo may not POST them all:
      full_name: person.name,
      address: person.address,
      phone: person.phone,
      date_of_birth: person.dob,
    },
    mode: input.mode ?? "mock",
    preparedAt: new Date().toISOString(),
  };
}

/** CLI entry: read JSON from argv or stdin-shaped env DEMO_* vars. */
function main(): void {
  const person: PiiPayload = {
    name: process.env.DEMO_FULL_NAME ?? "Alex Rivera",
    address: process.env.DEMO_ADDRESS ?? "123 Maple Ave, Austin, TX 78701",
    phone: process.env.DEMO_PHONE ?? "+1-512-555-0142",
    dob: process.env.DEMO_DOB ?? "1990-04-12",
    email: process.env.DEMO_EMAIL ?? "alex.rivera.optout@example.com",
  };

  const listing: BrokerListing = {
    broker: "spokeo",
    profileUrl:
      process.env.DEMO_PROFILE_URL ??
      "https://www.spokeo.com/Alex-Rivera/TX/Austin/p1234567890",
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  };

  const submission = prepareSpokeoOptOut({ person, listing, mode: "mock" });
  console.log(JSON.stringify(submission, null, 2));
  console.error(
    "\nPrepared only — do NOT submit until a human approves this exact PII payload via submit_opt_out.",
  );
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, "/").endsWith("/src/sandbox/spokeo-prepare-optout.ts") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("/sandbox/spokeo-prepare-optout.ts");

if (isDirectRun) {
  main();
}
