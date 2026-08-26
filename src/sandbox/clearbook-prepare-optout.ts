/**
 * Clearbook fixture broker prepare — sandbox/MCP prepare path for demo fan-out.
 */

import type { BrokerListing, OptOutSubmission, PiiPayload } from "../agents/types.js";
import { buildSubmission } from "./prepare-shared.js";

export function clearbookOptOutUrl(): string {
  const base = (process.env.UNDOX_FIXTURE_BASE_URL ?? "http://127.0.0.1:8792").replace(/\/$/, "");
  return `${base}/clearbook/optout.html`;
}

export function prepareClearbookOptOut(input: {
  person: PiiPayload;
  listing: BrokerListing;
  mode?: "mock" | "live";
}): OptOutSubmission {
  if (input.listing.broker !== "clearbook") {
    throw new Error(`prepareClearbookOptOut only handles clearbook, got ${input.listing.broker}`);
  }
  return buildSubmission({
    broker: "clearbook",
    optOutUrl: clearbookOptOutUrl(),
    listing: input.listing,
    person: input.person,
    formFields: {
      profile: input.listing.profileUrl,
      email: input.person.email,
      name: input.person.name,
      address: input.person.address,
      mobile: input.person.phone,
      birthdate: input.person.dob,
    },
    mode: input.mode,
    prepareRuntime: "sandbox-script",
  });
}

function main(): void {
  const person: PiiPayload = {
    name: process.env.DEMO_FULL_NAME ?? "Alex Rivera",
    address: process.env.DEMO_ADDRESS ?? "123 Maple Ave, Austin, TX 78701",
    phone: process.env.DEMO_PHONE ?? "+1-512-555-0142",
    dob: process.env.DEMO_DOB ?? "1990-04-12",
    email: process.env.DEMO_EMAIL ?? "alex.rivera.optout@example.com",
  };
  const base = (process.env.UNDOX_FIXTURE_BASE_URL ?? "http://127.0.0.1:8792").replace(/\/$/, "");
  const listing: BrokerListing = {
    broker: "clearbook",
    profileUrl: `${base}/clearbook/profile.html?q=${encodeURIComponent(person.name)}`,
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  };
  console.log(JSON.stringify(prepareClearbookOptOut({ person, listing }), null, 2));
  console.error("\nPrepared Clearbook fixture — submit only after human approval.");
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, "/").endsWith("/clearbook-prepare-optout.ts");
if (isDirectRun) main();
