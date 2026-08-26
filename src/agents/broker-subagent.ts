/**
 * Per-broker subagent — prepare (sandbox script) then approval-gated submit.
 * With TrueForge today, the root agent enables dynamicSubAgents and fans out;
 * these specs document the intended per-broker worker contract.
 */

import type { TrueForgeApi } from "@truefoundry/trueforge-sdk";
import type { BrokerId } from "./types.js";

export type BrokerSubagentId = BrokerId;

export const BROKER_SUBAGENT_NAMES: Record<BrokerId, string> = {
  spokeo: "undox-broker-spokeo",
  peoplefind: "undox-broker-peoplefind",
  clearbook: "undox-broker-clearbook",
};

export function brokerSubagentInstructions(broker: BrokerId): string {
  return `You are the Undox ${broker} broker subagent.
For the given session_id + person PII + profile_url:

1. Call run_sandbox_prepare(session_id, broker="${broker}", profile_url, …PII)
   — this runs the prepare TypeScript in a sandbox-script process (Double-O sandbox beat).
2. Call submit_opt_out(session_id, broker="${broker}", …exact same PII, mode=mock)
   — TrueForge will pause for human approval showing the literal PII. Wait for Allow.
3. Optionally call get_session_state(session_id) and return status.

Never use mode=live. Never invent PII. Never skip approval.`;
}

export function buildBrokerSubagentManifest(
  broker: BrokerId,
  modelName: string,
): TrueForgeApi.AgentSpec {
  const mcpName = process.env.UNDOX_MCP_NAME ?? "undox-tool";
  return {
    model: { name: modelName, params: { maxTokens: 768, temperature: 0, reasoningEffort: "none" } },
    instructions: brokerSubagentInstructions(broker),
    mcpServers: [
      {
        name: mcpName,
        enableTools: [
          "run_sandbox_prepare",
          "prepare_opt_out",
          "submit_opt_out",
          "get_session_state",
        ],
        requireApprovalForTools: ["submit_opt_out", "@write", "@destructive"],
        preload: true,
      },
    ],
    config: {
      sandbox: { enabled: true },
      generativeUi: { enabled: false },
      askUserQuestions: { enabled: false },
      dynamicSubAgents: { enabled: false },
      iterationLimit: 8,
    },
    skills: [{ name: broker === "spokeo" ? "spokeo" : broker }],
  };
}
