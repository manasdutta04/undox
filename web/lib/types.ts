export type BrokerId = "spokeo" | "peoplefind" | "clearbook";
export type ListingStatus =
  | "found"
  | "prepared"
  | "awaiting_approval"
  | "submitted"
  | "pending_confirmation"
  | "removed"
  | "rejected";

export interface PiiPayload {
  name: string;
  address: string;
  phone: string;
  dob: string;
  email: string;
}

export interface OptOutSubmission {
  broker: BrokerId;
  optOutUrl: string;
  pii: PiiPayload;
  formFields: Record<string, string>;
  mode: "mock" | "live";
  preparedAt: string;
  prepareRuntime?: string;
}

export interface SessionDashboard {
  found: boolean;
  sessionId: string;
  riskScore: number;
  riskLabel: "low" | "medium" | "high";
  brokers: Array<{
    broker: BrokerId;
    status: ListingStatus;
    profileUrl?: string;
  }>;
  milestones: Array<{
    broker: BrokerId;
    status: ListingStatus;
    event: string;
    at: string;
  }>;
  timeline: Array<{ at: string; event: string; detail?: string }>;
  summary: string;
}

export interface SessionDetail {
  found: boolean;
  sessionId: string;
  person?: PiiPayload;
  brokers: Array<{
    broker: BrokerId;
    status: ListingStatus;
    profileUrl?: string;
    optOutUrl?: string;
    lastSubmission?: OptOutSubmission;
  }>;
}
