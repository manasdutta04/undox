/**
 * Shared Undox MCP tools — multi-broker find/prepare/submit + dashboard + sandbox prepare.
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prepareSpokeoOptOut, SPOKEO_OPT_OUT_URL } from "../../sandbox/spokeo-prepare-optout.js";
import { preparePeoplefindOptOut, peoplefindOptOutUrl } from "../../sandbox/peoplefind-prepare-optout.js";
import { prepareClearbookOptOut, clearbookOptOutUrl } from "../../sandbox/clearbook-prepare-optout.js";
import { slugifyName } from "../../sandbox/prepare-shared.js";
import { buildExposureDashboard } from "../../agents/exposure-dashboard.js";
import type { BrokerId, BrokerListing, OptOutSubmission, PiiPayload } from "../../agents/types.js";
import { loadSession, markSubmitted, upsertBrokerStatus } from "./session-store.js";

const brokerEnum = z.enum(["spokeo", "peoplefind", "clearbook"]);

/** Reject truncated / placeholder session ids that small models invent from prompt ellipses. */
const sessionIdSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, {
    message: "session_id must be alphanumeric (plus . _ -)",
  })
  .refine((s) => !s.endsWith("-") && !s.endsWith(".") && !s.endsWith("_"), {
    message:
      "session_id looks truncated (ends with a separator). Pass the full id from the user (e.g. demo-live-1).",
  })
  .refine((s) => !s.includes("…") && !s.includes("..."), {
    message: "session_id must not contain ellipsis — never shorten the id.",
  });

const piiSchema = {
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  dob: z.string(),
  email: z.string().email(),
};

/** Optional PII — filled from the session's stored person when the model omits a field. */
const optionalPiiSchema = {
  name: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  dob: z.string().optional(),
  email: z.string().email().optional(),
};

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data) }],
  };
}

function personFrom(args: {
  name: string;
  address: string;
  phone: string;
  dob: string;
  email: string;
}): PiiPayload {
  return {
    name: args.name,
    address: args.address,
    phone: args.phone,
    dob: args.dob,
    email: args.email,
  };
}

type PartialPiiArgs = {
  session_id: string;
  name?: string;
  address?: string;
  phone?: string;
  dob?: string;
  email?: string;
};

/** Merge tool args with person already on the session (small models often drop phone/email mid-flow). */
function resolvePerson(args: PartialPiiArgs): PiiPayload {
  let storedPerson: PiiPayload | undefined;
  try {
    storedPerson = loadSession(args.session_id).person;
  } catch {
    storedPerson = undefined;
  }
  const person: PiiPayload = {
    name: (args.name ?? storedPerson?.name ?? "").trim(),
    address: (args.address ?? storedPerson?.address ?? "").trim(),
    phone: (args.phone ?? storedPerson?.phone ?? "").trim(),
    dob: (args.dob ?? storedPerson?.dob ?? "").trim(),
    email: (args.email ?? storedPerson?.email ?? "").trim(),
  };
  const missing = (["name", "address", "phone", "dob", "email"] as const).filter(
    (k) => !person[k],
  );
  if (missing.length) {
    throw new Error(
      `Missing PII: ${missing.join(", ")}. Pass full PII on the first find_* call, or include every field on this tool call.`,
    );
  }
  return person;
}

/** Resolve profile URL from args, then session listing, then fixture generator. */
function resolveProfileUrl(
  sessionId: string,
  broker: BrokerId,
  person: PiiPayload,
  profileUrl?: string,
): string {
  const provided = profileUrl?.trim();
  if (provided) return provided;
  try {
    const fromSession = loadSession(sessionId).brokers.find((b) => b.broker === broker)
      ?.listing?.profileUrl;
    if (fromSession) return fromSession;
  } catch {
    /* no session yet */
  }
  return listingFor(broker, person).profileUrl;
}

function samePii(a: PiiPayload, b: PiiPayload): boolean {
  return (
    a.name === b.name &&
    a.address === b.address &&
    a.phone === b.phone &&
    a.dob === b.dob &&
    a.email === b.email
  );
}

function logMockSubmit(sessionId: string, broker: BrokerId): void {
  console.error(
    "[undox mock submit]",
    JSON.stringify({ session_id: sessionId, broker, mode: "mock" }),
  );
}

function fixtureBase(): string {
  return (process.env.UNDOX_FIXTURE_BASE_URL ?? "http://127.0.0.1:8792").replace(/\/$/, "");
}

function listingFor(broker: BrokerId, person: PiiPayload): BrokerListing {
  const slug = slugifyName(person.name);
  const base = fixtureBase();
  if (broker === "spokeo") {
    return {
      broker: "spokeo",
      profileUrl: `https://www.spokeo.com/${slug}/p-fx`,
      matchedName: person.name,
      matchedLocation: "Austin, TX",
      source: "fixture",
    };
  }
  if (broker === "peoplefind") {
    return {
      broker: "peoplefind",
      profileUrl: `${base}/peoplefind/profile.html?name=${encodeURIComponent(person.name)}`,
      matchedName: person.name,
      matchedLocation: "Austin, TX",
      source: "fixture",
    };
  }
  return {
    broker: "clearbook",
    profileUrl: `${base}/clearbook/profile.html?q=${encodeURIComponent(person.name)}`,
    matchedName: person.name,
    matchedLocation: "Austin, TX",
    source: "fixture",
  };
}

function prepareFor(
  broker: BrokerId,
  person: PiiPayload,
  listing: BrokerListing,
): OptOutSubmission {
  if (broker === "spokeo") return prepareSpokeoOptOut({ person, listing, mode: "mock" });
  if (broker === "peoplefind") return preparePeoplefindOptOut({ person, listing, mode: "mock" });
  return prepareClearbookOptOut({ person, listing, mode: "mock" });
}

function optOutUrlFor(broker: BrokerId): string {
  if (broker === "spokeo") return SPOKEO_OPT_OUT_URL;
  if (broker === "peoplefind") return peoplefindOptOutUrl();
  return clearbookOptOutUrl();
}

function sandboxScriptFor(broker: BrokerId): string {
  if (broker === "spokeo") return "src/sandbox/spokeo-prepare-optout.ts";
  if (broker === "peoplefind") return "src/sandbox/peoplefind-prepare-optout.ts";
  return "src/sandbox/clearbook-prepare-optout.ts";
}

/** Build a fresh McpServer with all Undox tools registered. */
export function createUndoxServer(): McpServer {
  const server = new McpServer({
    name: "undox-tools",
    version: "0.2.0",
  });

  server.registerTool(
    "find_all_broker_listings",
    {
      title: "Find all broker listings",
      description:
        "Fixture search across spokeo + peoplefind + clearbook. Returns listings for subagent fan-out.",
      inputSchema: {
        session_id: sessionIdSchema,
        ...piiSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const person = personFrom(args);
      let state = loadSession(args.session_id, person);
      const brokers: BrokerId[] = ["spokeo", "peoplefind", "clearbook"];
      const listings: BrokerListing[] = [];
      for (const broker of brokers) {
        const listing = listingFor(broker, person);
        listings.push(listing);
        state = upsertBrokerStatus(state, broker, "found", { listing });
      }
      return jsonResult({ listings, count: listings.length });
    },
  );

  server.registerTool(
    "find_broker_listing",
    {
      title: "Find listing",
      description: "Find one broker listing (spokeo | peoplefind | clearbook).",
      inputSchema: {
        session_id: sessionIdSchema,
        broker: brokerEnum,
        ...piiSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      const person = personFrom(args);
      const listing = listingFor(args.broker, person);
      let state = loadSession(args.session_id, person);
      state = upsertBrokerStatus(state, args.broker, "found", { listing });
      return jsonResult({
        profile_url: listing.profileUrl,
        matched_name: listing.matchedName,
        broker: listing.broker,
      });
    },
  );

  server.registerTool(
    "run_sandbox_prepare",
    {
      title: "Run sandbox prepare script",
      description:
        "Execute the broker prepare TypeScript script (sandbox beat). Prefer this before submit. profile_url optional — uses the session listing or fixture URL when omitted.",
      inputSchema: {
        session_id: sessionIdSchema,
        broker: brokerEnum,
        profile_url: z.string().url().optional(),
        ...optionalPiiSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      let person: PiiPayload;
      try {
        person = resolvePerson(args);
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(err) }],
        };
      }
      const profileUrl = resolveProfileUrl(
        args.session_id,
        args.broker,
        person,
        args.profile_url,
      );
      const listing: BrokerListing = {
        broker: args.broker,
        profileUrl,
        matchedName: person.name,
        source: "fixture",
      };

      const scriptRel = sandboxScriptFor(args.broker);
      const scriptPath = resolve(process.cwd(), scriptRel);
      const env = {
        ...process.env,
        DEMO_FULL_NAME: person.name,
        DEMO_ADDRESS: person.address,
        DEMO_PHONE: person.phone,
        DEMO_DOB: person.dob,
        DEMO_EMAIL: person.email,
        DEMO_PROFILE_URL: profileUrl,
        UNDOX_FIXTURE_BASE_URL: fixtureBase(),
      };
      const ran = spawnSync(
        process.execPath,
        ["--import", "tsx", scriptPath],
        { env, encoding: "utf8", timeout: 20_000 },
      );

      if (ran.error || ran.status !== 0) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                ok: false,
                broker: args.broker,
                prepare_runtime: "sandbox-script",
                script: scriptRel,
                exit_code: ran.status,
                error: ran.error?.message,
                stderr_tail: (ran.stderr ?? "").slice(-400),
                ready_for_submit: false,
                message:
                  "Sandbox prepare script failed; broker was not marked prepared. Fix the script and retry.",
              }),
            },
          ],
        };
      }

      const submission = prepareFor(args.broker, person, listing);
      submission.prepareRuntime = "sandbox-script";
      let state = loadSession(args.session_id, person);
      state = upsertBrokerStatus(state, args.broker, "prepared", {
        listing,
        lastSubmission: submission,
        notes: `sandbox-script exit=${ran.status}`,
      });

      return jsonResult({
        ok: true,
        broker: args.broker,
        prepare_runtime: "sandbox-script",
        script: scriptRel,
        exit_code: ran.status,
        stderr_tail: (ran.stderr ?? "").slice(-400),
        opt_out_url: optOutUrlFor(args.broker),
        ready_for_submit: true,
      });
    },
  );

  server.registerTool(
    "prepare_opt_out",
    {
      title: "Prepare opt-out",
      description:
        "Build form fields in-process (fallback). Prefer run_sandbox_prepare for demos. PII and profile_url optional if already on the session.",
      inputSchema: {
        session_id: sessionIdSchema,
        broker: brokerEnum,
        profile_url: z.string().url().optional(),
        ...optionalPiiSchema,
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async (args) => {
      let person: PiiPayload;
      try {
        person = resolvePerson(args);
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(err) }],
        };
      }
      const profileUrl = resolveProfileUrl(
        args.session_id,
        args.broker,
        person,
        args.profile_url,
      );
      const listing: BrokerListing = {
        broker: args.broker,
        profileUrl,
        matchedName: person.name,
        source: "fixture",
      };
      const submission = prepareFor(args.broker, person, listing);
      submission.prepareRuntime = "mcp-inline";
      let state = loadSession(args.session_id, person);
      state = upsertBrokerStatus(state, args.broker, "prepared", {
        listing,
        lastSubmission: submission,
      });
      return jsonResult({
        ready: true,
        broker: args.broker,
        opt_out_url: optOutUrlFor(args.broker),
        prepare_runtime: "mcp-inline",
        next: "call submit_opt_out with session_id + broker + mode=mock (PII may be omitted if session already has the person)",
      });
    },
  );

  server.registerTool(
    "submit_opt_out",
    {
      title: "Submit opt-out — human must Allow exact PII",
      description:
        "APPROVAL-GATED mock submit. TrueForge will pause and show the literal name, address, phone, dob, and email — the human must Allow or Deny. Pass session_id, broker, mode=mock. PII optional if the session already has the person from find/prepare.",
      inputSchema: {
        session_id: sessionIdSchema,
        broker: brokerEnum,
        ...optionalPiiSchema,
        mode: z.enum(["mock", "live"]).default("mock"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      if (args.mode === "live") {
        return {
          isError: true,
          content: [{ type: "text" as const, text: "Use mode=mock unless UNDOX_ALLOW_LIVE=1 (hackathon demo uses mock)." }],
        };
      }
      let person: PiiPayload;
      try {
        person = resolvePerson(args);
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(err) }],
        };
      }
      const state = loadSession(args.session_id, person);
      const brokerState = state.brokers.find((b) => b.broker === args.broker);
      const prepared = brokerState?.lastSubmission;
      if (!prepared) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Call run_sandbox_prepare (or prepare_opt_out) for ${args.broker} first.`,
            },
          ],
        };
      }
      if (!samePii(prepared.pii, person)) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "PII does not match the prepared payload. Re-run prepare with the same person.",
            },
          ],
        };
      }

      const submission: OptOutSubmission = { ...prepared, pii: prepared.pii, mode: "mock" };
      logMockSubmit(args.session_id, args.broker);

      let next = upsertBrokerStatus(state, args.broker, "awaiting_approval", {
        listing: submission.listing,
        lastSubmission: submission,
      });
      next = markSubmitted(next, submission, "Mock submit — no live HTTP POST.");

      return jsonResult({
        ok: true,
        status: "submitted",
        broker: args.broker,
        pii_sent: prepared.pii,
      });
    },
  );

  server.registerTool(
    "get_session_state",
    {
      title: "Get session",
      description: "Return broker statuses for resume / reconnect demos.",
      inputSchema: { session_id: sessionIdSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ session_id }) => {
      try {
        const state = loadSession(session_id);
        return jsonResult({
          session_id: state.sessionId,
          brokers: state.brokers.map((b) => ({
            broker: b.broker,
            status: b.status,
            profile_url: b.listing?.profileUrl,
          })),
          timeline: state.timeline.slice(-20),
        });
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(err) }],
        };
      }
    },
  );

  server.registerTool(
    "get_exposure_dashboard",
    {
      title: "Exposure dashboard",
      description:
        "Risk score + per-broker status cards for Generative UI. Call after finds/submits.",
      inputSchema: { session_id: sessionIdSchema },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
      },
    },
    async ({ session_id }) => {
      try {
        const state = loadSession(session_id);
        return jsonResult(buildExposureDashboard(state));
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(err) }],
        };
      }
    },
  );

  // Fast path kept for cloud TPM demos
  server.registerTool(
    "run_spokeo_opt_out",
    {
      title: "One-shot Spokeo opt-out",
      description: "Optional fast path: Spokeo find+prepare+mock-submit in one approval.",
      inputSchema: {
        session_id: sessionIdSchema,
        ...piiSchema,
        mode: z.enum(["mock", "live"]).default("mock"),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: true,
      },
    },
    async (args) => {
      if (args.mode === "live") {
        return {
          isError: true,
          content: [{ type: "text" as const, text: "Use mode=mock." }],
        };
      }
      const person = personFrom(args);
      const listing = listingFor("spokeo", person);
      const submission = prepareSpokeoOptOut({ person, listing, mode: "mock" });
      let state = loadSession(args.session_id, person);
      state = upsertBrokerStatus(state, "spokeo", "found", { listing });
      state = upsertBrokerStatus(state, "spokeo", "prepared", {
        listing,
        lastSubmission: submission,
      });
      state = upsertBrokerStatus(state, "spokeo", "awaiting_approval", {
        listing,
        lastSubmission: submission,
      });
      state = markSubmitted(state, submission, "One-shot mock submit.");
      logMockSubmit(args.session_id, "spokeo");
      return jsonResult({
        ok: true,
        status: "submitted",
        broker: "spokeo",
        profile_url: listing.profileUrl,
      });
    },
  );

  return server;
}
