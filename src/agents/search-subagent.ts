/**
 * Search worker contract for TrueForge dynamicSubAgents.
 *
 * Instruction template only — not a separately registered saved agent.
 * Root orchestrator enables dynamicSubAgents; if no worker spawns, it calls
 * find_all_broker_listings itself.
 */

import type { TrueForgeApi } from "@truefoundry/trueforge-sdk";

export const SEARCH_SUBAGENT_NAME = "undox-search";

export const SEARCH_SUBAGENT_INSTRUCTIONS = `You are the Undox search worker.
Goal: locate people-search listings for one person across brokers.

Tools (Undox MCP):
1. Prefer find_all_broker_listings(session_id, name, address, phone, dob, email)
   — returns spokeo + peoplefind + clearbook fixtures in one call.
2. Or call find_broker_listing once per broker if needed.

Return a short JSON summary of profile URLs per broker. Do not submit opt-outs.
Do not invent URLs. Use only tool results. Never ask the user for PII already provided.`;

/** Instruction-only worker spec (not a separately registered TrueForge agent). */
export function buildSearchSubagentManifest(modelName: string): TrueForgeApi.AgentSpec {
  const mcpName = process.env.UNDOX_MCP_NAME ?? "undox-tool";
  return {
    model: { name: modelName, params: { maxTokens: 512, temperature: 0, reasoningEffort: "none" } },
    instructions: SEARCH_SUBAGENT_INSTRUCTIONS,
    mcpServers: [
      {
        name: mcpName,
        enableTools: ["find_all_broker_listings", "find_broker_listing", "get_session_state"],
        requireApprovalForTools: [],
        preload: true,
      },
    ],
    config: {
      sandbox: { enabled: false },
      generativeUi: { enabled: false },
      askUserQuestions: { enabled: false },
      dynamicSubAgents: { enabled: false },
      iterationLimit: 6,
    },
  };
}
