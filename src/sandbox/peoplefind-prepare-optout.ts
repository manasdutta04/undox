/**
 * PeopleFind fixture broker prepare — run via MCP or `npm run sandbox:peoplefind-prepare`.
 * Demo-only static HTML broker (see fixtures/demo-brokers/peoplefind).
 */

import type { BrokerListing, OptOutSubmission, PiiPayload } from "../agents/types.js";
import { buildSubmission } from "./prepare-shared.js";

export function peoplefindOptOutUrl(): string {
  const base = (process.env.UNDOX_FIXTURE_BASE_URL ?? "http://127.0.0.1:8792").replace(/\/$/, "");
  return `${base}/peoplefind/optout.html`;
}

export function preparePeoplefindOptOut(input: {
  person: PiiPayload;
  listing: BrokerListing;
  mode?: "mock" | "live";
}): OptOutSubmission {
  if (input.listing.broker !== "peoplefind") {
    throw new Error(`preparePeoplefindOptOut only handles peoplefind, got ${input.listing.broker}`);
  }
  return buildSubmission({
    broker: "peoplefind",
    optOutUrl: peoplefindOptOutUrl(),
    listing: input.listing,
    person: input.person,
    formFields: {
      listing_id: input.listing.profileUrl,
      contact_email: input.person.email,
      full_name: input.person.name,
      home_address: input.person.address,
      phone: input.person.phone,
      dob: input.person.dob,
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
  const listing: BrokerListing = {
    broker: "peoplefind",
    profileUrl: `${(process.env.UNDOX_FIXTURE_BASE_URL ?? "http://127.0.0.1:8792").replace(/\/$/, "")}/peoplefind/profile.html?name=${encodeURIComponent(person.name)}`,
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  };
  console.log(JSON.stringify(preparePeoplefindOptOut({ person, listing }), null, 2));
  console.error("\nPrepared PeopleFind fixture — submit only after human approval.");
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, "/").endsWith("/peoplefind-prepare-optout.ts");
if (isDirectRun) main();
