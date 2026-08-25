/**
 * Undox MCP tools — search fixture, prepare opt-out, and approval-gated mock submit.
 *
 * Register this server in TrueForge: Settings → Connectors → Add MCP Server
 *   Transport: stdio
 *   Command: npx
 *   Args: tsx src/mcp/undox-tools/server.ts
 *   (run from the undox repo root; or use `npm run mcp:undox-tools`)
 *
 * `submit_opt_out` is annotated as write/destructive so TrueForge pauses and
 * shows the tool arguments (the exact PII payload) before execution.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { prepareSpokeoOptOut, SPOKEO_OPT_OUT_URL } from "../../sandbox/spokeo-prepare-optout.js";
import type { BrokerListing, OptOutSubmission, PiiPayload } from "../../agents/types.js";
import { loadSession, markSubmitted, saveSession, upsertBrokerStatus } from "./session-store.js";

const piiSchema = {
  name: z.string().describe("Full legal name"),
  address: z.string().describe("Current home address"),
  phone: z.string().describe("Phone number"),
  dob: z.string().describe("Date of birth (YYYY-MM-DD)"),
  email: z.string().email().describe("Email used for opt-out confirmation"),
};

function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

const server = new McpServer({
  name: "undox-tools",
  version: "0.1.0",
});

server.registerTool(
  "find_broker_listing",
  {
    title: "Find broker listing",
    description:
      "Search for a person's listing on a supported broker. PR1: Spokeo only, returns a fixture listing (real search MCP comes later).",
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
    const person: PiiPayload = {
      name: args.name,
      address: args.address,
      phone: args.phone,
      dob: args.dob,
      email: args.email,
    };
    const slug = person.name.trim().toLowerCase().replace(/\s+/g, "-");
    const listing: BrokerListing = {
      broker: "spokeo",
      profileUrl: `https://www.spokeo.com/${encodeURIComponent(
        person.name.replace(/\s+/g, "-"),
      )}/TX/Austin/p-fixture-${slug}`,
      matchedName: person.name,
      matchedLocation: "Austin, TX",
      source: "fixture",
    };

    let state = loadSession(args.session_id, person);
    state = upsertBrokerStatus(state, "spokeo", "found", { listing });
    return jsonResult({ listing, session: state });
  },
);

server.registerTool(
  "prepare_opt_out",
  {
    title: "Prepare opt-out payload",
    description:
      "Run the Spokeo prepare script (sandbox-equivalent): parse listing + person into form fields. Does NOT submit.",
    inputSchema: {
      session_id: z.string(),
      broker: z.literal("spokeo"),
      profile_url: z.string().url(),
      matched_name: z.string().optional(),
      matched_location: z.string().optional(),
      ...piiSchema,
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      openWorldHint: false,
    },
  },
  async (args) => {
    const person: PiiPayload = {
      name: args.name,
      address: args.address,
      phone: args.phone,
      dob: args.dob,
      email: args.email,
    };
    const listing: BrokerListing = {
      broker: "spokeo",
      profileUrl: args.profile_url,
      matchedName: args.matched_name ?? person.name,
      matchedLocation: args.matched_location,
      source: "fixture",
    };
    const submission = prepareSpokeoOptOut({ person, listing, mode: "mock" });
    let state = loadSession(args.session_id, person);
    state = upsertBrokerStatus(state, "spokeo", "prepared", {
      listing,
      lastSubmission: submission,
    });
    return jsonResult({
      submission,
      approval_hint:
        "Next: call submit_opt_out with this exact pii + form_fields. TrueForge will pause for human approval.",
      opt_out_url: SPOKEO_OPT_OUT_URL,
      session: state,
    });
  },
);

server.registerTool(
  "submit_opt_out",
  {
    title: "Submit opt-out (APPROVAL REQUIRED)",
    description:
      "IRREVERSIBLE-shaped action: submit an opt-out payload to a broker. PR1 mocks the HTTP POST (logs + marks session submitted). Always pass the exact PII fields so the approval UI shows name, address, phone, and DOB.",
    inputSchema: {
      session_id: z.string(),
      broker: z.literal("spokeo"),
      opt_out_url: z.string().url(),
      profile_url: z.string().url(),
      // Exact PII — TrueForge shows these args in the approval gate
      name: z.string().describe("PII: full name about to be sent"),
      address: z.string().describe("PII: home address about to be sent"),
      phone: z.string().describe("PII: phone about to be sent"),
      dob: z.string().describe("PII: date of birth about to be sent"),
      email: z.string().email().describe("PII: email about to be sent"),
      form_fields_json: z
        .string()
        .describe("JSON string of broker form fields from prepare_opt_out"),
      mode: z.enum(["mock", "live"]).default("mock"),
    },
    annotations: {
      // TrueForge default require_approval_for_tools: ["@write", "@destructive"]
      readOnlyHint: false,
      destructiveHint: true,
      openWorldHint: true,
    },
  },
  async (args) => {
    if (args.mode === "live") {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: "Live submission is disabled in PR1. Use mode=mock. Real broker POSTs land in a later PR.",
          },
        ],
      };
    }

    const person: PiiPayload = {
      name: args.name,
      address: args.address,
      phone: args.phone,
      dob: args.dob,
      email: args.email,
    };
    const formFields = JSON.parse(args.form_fields_json) as Record<string, string>;
    const listing: BrokerListing = {
      broker: "spokeo",
      profileUrl: args.profile_url,
      matchedName: person.name,
      source: "fixture",
    };
    const submission: OptOutSubmission = {
      broker: "spokeo",
      optOutUrl: args.opt_out_url,
      listing,
      pii: person,
      formFields,
      mode: "mock",
      preparedAt: new Date().toISOString(),
    };

    // Mock submit: log the irreversible-shaped action, do not POST.
    console.error("[undox mock submit]", JSON.stringify(submission, null, 2));

    let state = loadSession(args.session_id, person);
    state = upsertBrokerStatus(state, "spokeo", "awaiting_approval", {
      listing,
      lastSubmission: submission,
    });
    state = markSubmitted(
      state,
      submission,
      "PR1 mock submit — no live HTTP POST. Marked submitted in session state.",
    );

    return jsonResult({
      ok: true,
      mode: "mock",
      message: "Mock submission recorded. Status → submitted (pending_confirmation in later PR).",
      pii_sent: submission.pii,
      session: state,
    });
  },
);

server.registerTool(
  "get_session_state",
  {
    title: "Get Undox session state",
    description: "Return broker statuses and timeline for a session.",
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
      return jsonResult(state);
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: String(err) }],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("undox-tools MCP server listening on stdio");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
