/**
 * Shared helpers for fixture / Spokeo prepare scripts run in sandbox or MCP.
 */

import type { BrokerId, BrokerListing, OptOutSubmission, PiiPayload } from "../agents/types.js";

export function slugifyName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function buildSubmission(args: {
  broker: BrokerId;
  optOutUrl: string;
  listing: BrokerListing;
  person: PiiPayload;
  formFields: Record<string, string>;
  mode?: "mock" | "live";
  prepareRuntime?: OptOutSubmission["prepareRuntime"];
}): OptOutSubmission {
  return {
    broker: args.broker,
    optOutUrl: args.optOutUrl,
    listing: args.listing,
    pii: { ...args.person },
    formFields: args.formFields,
    mode: args.mode ?? "mock",
    preparedAt: new Date().toISOString(),
    prepareRuntime: args.prepareRuntime ?? "sandbox-script",
  };
}
