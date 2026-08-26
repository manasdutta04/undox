/**
 * Shared Undox MCP tool registration (stdio + HTTP transports).
 * Schemas + results kept tiny for Groq free ~8k TPM.
 *
 * submit_opt_out only needs session_id + PII (for the approval UI).
 * URLs/form fields are loaded from the prepared session — avoids
 * Groq "failed_generation" on huge form_fields_json tool calls.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { prepareSpokeoOptOut, SPOKEO_OPT_OUT_URL } from "../../sandbox/spokeo-prepare-optout.js";
import type { BrokerListing, OptOutSubmission, PiiPayload } from "../../agents/types.js";
import { loadSession, markSubmitted, upsertBrokerStatus } from "./session-store.js";

const piiSchema = {
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  dob: z.string(),
  email: z.string().email(),
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

function samePii(a: PiiPayload, b: PiiPayload): boolean {
  return (
    a.name === b.name &&
    a.address === b.address &&
    a.phone === b.phone &&
    a.dob === b.dob &&
    a.email === b.email
  );
}

function logMockSubmit(sessionId: string): void {
  // Never log raw PII — terminals/CI logs are easy to leak.
  console.error("[undox mock submit]", JSON.stringify({ session_id: sessionId, mode: "mock" }));
}

/** Build a fresh McpServer with all Undox tools registered. */
export function createUndoxServer(): McpServer {
  const server = new McpServer({
    name: "undox-tools",
    version: "0.1.0",
  });

  // One-shot demo tool: 1 LLM call + 1 approval fits Groq free ~8k TPM.
  server.registerTool(
    "run_spokeo_opt_out",
    {
      title: "Run Spokeo opt-out",
      description: "Find+prepare+mock-submit Spokeo. Pass session_id + PII. mode=mock.",
      inputSchema: {
        session_id: z.string(),
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
          content: [{ type: "text" as const, text: "Use mode=mock in PR1." }],
        };
      }
      const person = personFrom(args);
      const slug = person.name.trim().toLowerCase().replace(/\s+/g, "-");
      const listing: BrokerListing = {
        broker: "spokeo",
        profileUrl: `https://www.spokeo.com/${slug}/p-fx`,
        matchedName: person.name,
        matchedLocation: "Austin, TX",
        source: "fixture",
      };
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
      state = markSubmitted(state, submission, "PR1 one-shot mock submit.");

      logMockSubmit(args.session_id);
      return jsonResult({
        ok: true,
        status: "submitted",
        profile_url: listing.profileUrl,
        opt_out_url: SPOKEO_OPT_OUT_URL,
        pii_sent: person,
      });
    },
  );

  server.registerTool(
    "find_broker_listing",
    {
      title: "Find listing",
      description: "Spokeo fixture search.",
      inputSchema: {
        session_id: z.string(),
        broker: z.literal("spokeo"),
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
      const slug = person.name.trim().toLowerCase().replace(/\s+/g, "-");
      const listing: BrokerListing = {
        broker: "spokeo",
        profileUrl: `https://www.spokeo.com/${slug}/p-fx`,
        matchedName: person.name,
        matchedLocation: "Austin, TX",
        source: "fixture",
      };

      let state = loadSession(args.session_id, person);
      state = upsertBrokerStatus(state, "spokeo", "found", { listing });
      return jsonResult({
        profile_url: listing.profileUrl,
        matched_name: listing.matchedName,
      });
    },
  );

  server.registerTool(
    "prepare_opt_out",
    {
      title: "Prepare opt-out",
      description: "Build Spokeo form; stores payload for submit_opt_out.",
      inputSchema: {
        session_id: z.string(),
        broker: z.literal("spokeo"),
        profile_url: z.string().url(),
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
      const listing: BrokerListing = {
        broker: "spokeo",
        profileUrl: args.profile_url,
        matchedName: person.name,
        source: "fixture",
      };
      const submission = prepareSpokeoOptOut({ person, listing, mode: "mock" });
      let state = loadSession(args.session_id, person);
      state = upsertBrokerStatus(state, "spokeo", "prepared", {
        listing,
        lastSubmission: submission,
      });
      return jsonResult({
        ready: true,
        opt_out_url: SPOKEO_OPT_OUT_URL,
        next: "call submit_opt_out with session_id + same PII + mode=mock",
      });
    },
  );

  server.registerTool(
    "submit_opt_out",
    {
      title: "Submit opt-out",
      description:
        "Approval-gated mock submit. Pass session_id + exact PII (name/address/phone/dob/email) + mode=mock. Form/URLs load from prepare.",
      inputSchema: {
        session_id: z.string(),
        broker: z.literal("spokeo"),
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
          content: [{ type: "text" as const, text: "Use mode=mock in PR1." }],
        };
      }

      const person = personFrom(args);
      const state = loadSession(args.session_id, person);
      const brokerState = state.brokers.find((b) => b.broker === "spokeo");
      const prepared = brokerState?.lastSubmission;
      if (!prepared) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "Call prepare_opt_out first for this session_id.",
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
              text: "PII does not match the prepared payload. Re-run prepare_opt_out with the same person.",
            },
          ],
        };
      }

      const submission: OptOutSubmission = {
        ...prepared,
        pii: prepared.pii,
        mode: "mock",
      };

      logMockSubmit(args.session_id);

      let next = upsertBrokerStatus(state, "spokeo", "awaiting_approval", {
        listing: submission.listing,
        lastSubmission: submission,
      });
      next = markSubmitted(next, submission, "PR1 mock submit — no live HTTP POST.");

      return jsonResult({ ok: true, status: "submitted", pii_sent: prepared.pii });
    },
  );

  server.registerTool(
    "get_session_state",
    {
      title: "Get session",
      description: "Session status.",
      inputSchema: { session_id: z.string() },
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
          brokers: state.brokers.map((b) => ({ broker: b.broker, status: b.status })),
        });
      } catch (err) {
        return {
          isError: true,
          content: [{ type: "text" as const, text: String(err) }],
        };
      }
    },
  );

  return server;
}
