/**
 * Shared types for Undox broker opt-out payloads and session tracking.
 * The approval gate must surface the full PiiPayload before any submit.
 */

export type BrokerId = "spokeo" | "peoplefind" | "clearbook";

export type ListingStatus =
  | "found"
  | "prepared"
  | "awaiting_approval"
  | "submitted"
  | "pending_confirmation"
  | "removed"
  | "rejected";

/** Exact fields shown in the human approval modal before submission. */
export interface PiiPayload {
  name: string;
  address: string;
  phone: string;
  dob: string;
  email: string;
}

export interface BrokerListing {
  broker: BrokerId;
  profileUrl: string;
  matchedName: string;
  matchedLocation?: string;
  source: "search" | "fixture";
}

export interface OptOutSubmission {
  broker: BrokerId;
  optOutUrl: string;
  listing: BrokerListing;
  /** Literal PII about to be sent — this is what the approval gate displays. */
  pii: PiiPayload;
  /** Broker-specific form fields derived by the prepare/sandbox step. */
  formFields: Record<string, string>;
  mode: "mock" | "live";
  preparedAt: string;
  /** Where prepare code ran (demo narration for Double-O sandbox beat). */
  prepareRuntime?: "mcp-inline" | "sandbox-script";
}

export interface SessionBrokerState {
  broker: BrokerId;
  status: ListingStatus;
  listing?: BrokerListing;
  lastSubmission?: OptOutSubmission;
  updatedAt: string;
  notes?: string;
}

export interface UndoxSessionState {
  sessionId: string;
  person: PiiPayload;
  brokers: SessionBrokerState[];
  timeline: Array<{ at: string; event: string; detail?: string }>;
}

export interface ExposureDashboard {
  sessionId: string;
  riskScore: number;
  riskLabel: "low" | "medium" | "high";
  brokers: Array<{
    broker: BrokerId;
    status: ListingStatus;
    profileUrl?: string;
  }>;
  timeline: UndoxSessionState["timeline"];
  summary: string;
}
