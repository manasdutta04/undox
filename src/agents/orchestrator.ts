/**
 * Undox orchestrator — PR1 Spokeo mock opt-out.
 *
 * Groq free TPM is ~8k/min. A 3-tool loop (~2.5k tokens/turn) always 429s.
 * Demo path: one tool `run_spokeo_opt_out` → one approval → done.
 */

import { TrueForge, type TrueForgeApi } from "@truefoundry/trueforge-sdk";

export const ORCHESTRATOR_NAME = "undox-orchestrator";

export const ORCHESTRATOR_INSTRUCTIONS = `Undox. Call run_spokeo_opt_out once with session_id,name,address,phone,dob,email,mode=mock. No other tools. No chatter.`;

function modelParamsFor(modelName: string): TrueForgeApi.ModelParams {
  const isGptOss = /gpt-oss/i.test(modelName);
  const isOllama = /^ollama\//i.test(modelName);
  return {
    // Local Ollama has no TPM cap — allow a short post-tool confirmation.
    // Cloud free tiers stay tiny to avoid 429s.
    maxTokens: isOllama ? 1024 : 128,
    temperature: 0,
    parallelToolCalls: false,
    reasoningEffort: process.env.UNDOX_REASONING_EFFORT ?? (isGptOss ? "low" : "none"),
  };
}

/** Agent manifest for TrueForge agents.create / inline session spec. */
export function buildOrchestratorManifest(modelName: string): TrueForgeApi.AgentSpec {
  const attachSkills = process.env.UNDOX_ATTACH_SKILLS !== "false";
  const mcpName = process.env.UNDOX_MCP_NAME ?? "undox-tool";

  return {
    model: {
      name: modelName,
      params: modelParamsFor(modelName),
    },
    instructions: ORCHESTRATOR_INSTRUCTIONS,
    mcpServers: [
      {
        name: mcpName,
        enableTools: ["run_spokeo_opt_out"],
        requireApprovalForTools: ["run_spokeo_opt_out", "@write", "@destructive"],
        preload: true,
      },
    ],
    ...(attachSkills ? { skills: [{ name: "spokeo" }] } : {}),
    config: {
      sandbox: { enabled: attachSkills },
      generativeUi: { enabled: false },
      askUserQuestions: { enabled: false },
      dynamicSubAgents: { enabled: false },
      iterationLimit: 3,
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
