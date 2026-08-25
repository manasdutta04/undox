/**
 * Undox orchestrator agent — PR1: single-broker (Spokeo) end-to-end loop.
 *
 * Flow:
 *   1. find_broker_listing (fixture search for Spokeo)
 *   2. prepare_opt_out / sandbox spokeo-prepare script → build form + PII payload
 *   3. submit_opt_out → TrueForge approval gate shows exact PII → mock submit
 *
 * Register via `npm run register:agent` once TrueForge is running and the
 * undox-tools connector + spokeo skill are configured.
 */

import { TrueForge, type TrueForgeApi } from "@truefoundry/trueforge-sdk";

export const ORCHESTRATOR_NAME = "undox-orchestrator";

export const ORCHESTRATOR_INSTRUCTIONS = `You are Undox, a privacy agent that finds data-broker listings of a person's PII and requests removal.

## Scope for this build (PR1)
- Supported broker: Spokeo only.
- Submission mode: mock (never live-POST to Spokeo).
- You MUST stop at the human approval gate before any submission.

## Tools (undox-tools MCP)
1. find_broker_listing — locate the Spokeo profile (fixture search in PR1).
2. prepare_opt_out — build the opt-out form fields and the exact PII payload. Prefer also following the spokeo skill / sandbox script src/sandbox/spokeo-prepare-optout.ts when the sandbox is available.
3. submit_opt_out — gated, destructive. Call ONLY after prepare. Pass the literal PII fields (name, address, phone, dob, email) so the approval UI shows exactly what would be sent.
4. get_session_state — read broker statuses / timeline.

## Hard rules
- Never call submit_opt_out until prepare_opt_out succeeded for that listing.
- Never invent or omit PII fields on submit — copy them exactly from the user's request / prepare output.
- If CAPTCHA or rate-limiting is indicated by a skill, stop and ask the human; do not bypass.
- After approval + mock submit, summarize status (submitted) and show get_session_state.
- Use a stable session_id for the conversation (e.g. the TrueForge session id if known, otherwise a UUID you generate once and reuse).

## User input you need
Full name, home address, phone, date of birth (YYYY-MM-DD), and an email for confirmation. If any are missing, ask before searching.
`;

/** Agent manifest for TrueForge agents.create / inline session spec. */
export function buildOrchestratorManifest(modelName: string): TrueForgeApi.AgentSpec {
  const attachSkills = process.env.UNDOX_ATTACH_SKILLS !== "false";

  return {
    model: { name: modelName },
    instructions: ORCHESTRATOR_INSTRUCTIONS,
    mcpServers: [
      {
        name: "undox-tools",
        enableTools: ["@all"],
        // Explicit gate on the irreversible-shaped tool (also covered by @destructive).
        requireApprovalForTools: ["submit_opt_out", "@write", "@destructive"],
        preload: true,
      },
    ],
    ...(attachSkills ? { skills: [{ name: "spokeo" }] } : {}),
    config: {
      // Sandbox required when skills are attached; Daytona on Windows, or WSL/Linux/macOS.
      sandbox: { enabled: attachSkills },
      generativeUi: { enabled: true },
      askUserQuestions: { enabled: true },
      // PR1: single broker — keep subagents off until PR2.
      dynamicSubAgents: { enabled: false },
      iterationLimit: 40,
    },
  };
}

export type OrchestratorClient = Pick<TrueForge, "agents">;

/**
 * Create or replace the saved undox-orchestrator agent in a running TrueForge server.
 */
export async function registerOrchestrator(
  client: OrchestratorClient,
  modelName: string,
): Promise<{ id: string; name: string; created: boolean }> {
  const manifest = buildOrchestratorManifest(modelName);

  const listed = await client.agents.list();
  const existing = listed.data.find((agent) => agent.name === ORCHESTRATOR_NAME);

  if (existing) {
    const updated = await client.agents.update(existing.id, { manifest });
    return { id: updated.data.id, name: updated.data.name, created: false };
  }

  const created = await client.agents.create({
    name: ORCHESTRATOR_NAME,
    manifest,
  });
  return { id: created.data.id, name: created.data.name, created: true };
}
