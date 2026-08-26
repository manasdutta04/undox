/**
 * Undox orchestrator — Double-O harness: MCP + sandbox + subagents + approval + UI.
 * Prefer local Ollama (no TPM) so multi-tool / subagent loops complete on stage.
 */

import { TrueForge, type TrueForgeApi } from "@truefoundry/trueforge-sdk";
import { BROKER_SUBAGENT_NAMES } from "./broker-subagent.js";
import { SEARCH_SUBAGENT_NAME } from "./search-subagent.js";

export const ORCHESTRATOR_NAME = "undox-orchestrator";

const DASHBOARD_URL = (
  process.env.UNDOX_DASHBOARD_URL ??
  `http://127.0.0.1:${process.env.UNDOX_DASHBOARD_PORT ?? "8793"}`
).replace(/\/$/, "");

export const ORCHESTRATOR_INSTRUCTIONS = `You are Undox — remove a person's PII from people-search brokers with human approval.

Session id: use a stable id the user provides, or invent demo-<short> and reuse it every tool call.
Tell the user they can watch live status at the local Exposure Dashboard:
  ${DASHBOARD_URL}/?session=<session_id>

Flow (do not skip steps):
1. SEARCH — Call find_all_broker_listings with session_id + full PII (name, address, phone, dob, email).
   Prefer spawning a dynamic subagent for search when the harness offers it (${SEARCH_SUBAGENT_NAME} style).
2. FAN-OUT — For EACH listing (spokeo, peoplefind, clearbook), prepare then submit.
   Prefer parallel dynamic subagents (one per broker: ${BROKER_SUBAGENT_NAMES.spokeo}, ${BROKER_SUBAGENT_NAMES.peoplefind}, ${BROKER_SUBAGENT_NAMES.clearbook}).
   Per broker:
   a. run_sandbox_prepare(session_id, broker, profile_url, same PII) — sandbox prepare script MUST run.
   b. submit_opt_out(session_id, broker, same PII, mode=mock) — APPROVAL GATE showing literal name/address/phone/dob/email; wait for human Allow.
3. DASHBOARD — Call get_exposure_dashboard(session_id). Then render Generative UI (OpenUI) using built-ins.
   Prefer a root Card with Stack children:
   - TextContent with riskLabel + riskScore + summary
   - Table of broker / status / profileUrl
   - short Markdown timeline of the last events
   Example shape (fill with real tool values):
   \`\`\`openui
   root = Card([header, brokers, timeline])
   header = Stack([TextContent("Exposure · high · 84", "large-heavy"), TextContent("3 broker(s) tracked · session demo-…", "small")])
   brokers = Table([Col("Broker"), Col("Status"), Col("Profile")], [["spokeo","submitted","https://…"],["peoplefind","prepared","http://…"]])
   timeline = Markdown("- broker.submitted · spokeo\\n- broker.prepared · peoplefind")
   \`\`\`
   If Generative UI fails, print a clear markdown table AND tell the user to open ${DASHBOARD_URL}/?session=<id>.
4. RESUME — If the user reconnects, call get_session_state(session_id) and summarize statuses.

Rules:
- mode=mock only. Never live POST.
- Never invent profile URLs or PII.
- Keep chatter minimal; narrate harness beats briefly (search → sandbox prepare → approval → dashboard).
- Optional fast path only if user asks: run_spokeo_opt_out (Spokeo one-shot).`;

function modelParamsFor(modelName: string): TrueForgeApi.ModelParams {
  const isGptOss = /gpt-oss/i.test(modelName);
  const isOllama = /^ollama\//i.test(modelName);
  return {
    maxTokens: isOllama ? 2048 : 256,
    temperature: 0,
    parallelToolCalls: isOllama,
    reasoningEffort: process.env.UNDOX_REASONING_EFFORT ?? (isGptOss ? "low" : "none"),
  };
}

function enabledTools(): string[] {
  if (process.env.UNDOX_ONESHOT === "true") {
    return ["run_spokeo_opt_out"];
  }
  return [
    "find_all_broker_listings",
    "find_broker_listing",
    "run_sandbox_prepare",
    "prepare_opt_out",
    "submit_opt_out",
    "get_session_state",
    "get_exposure_dashboard",
    "run_spokeo_opt_out",
  ];
}

/** Agent manifest for TrueForge agents.create / inline session spec. */
export function buildOrchestratorManifest(modelName: string): TrueForgeApi.AgentSpec {
  const attachSkills = process.env.UNDOX_ATTACH_SKILLS !== "false";
  const mcpName = process.env.UNDOX_MCP_NAME ?? "undox-tool";
  const generativeUi = process.env.UNDOX_GENERATIVE_UI !== "false";
  const tools = enabledTools();
  const approvalTools = tools.includes("submit_opt_out")
    ? ["submit_opt_out", "run_spokeo_opt_out", "@write", "@destructive"]
    : ["run_spokeo_opt_out", "@write", "@destructive"];

  return {
    model: {
      name: modelName,
      params: modelParamsFor(modelName),
    },
    instructions:
      process.env.UNDOX_ONESHOT === "true"
        ? `Undox oneshot. Call run_spokeo_opt_out once with session_id,name,address,phone,dob,email,mode=mock.`
        : ORCHESTRATOR_INSTRUCTIONS,
    mcpServers: [
      {
        name: mcpName,
        enableTools: tools,
        requireApprovalForTools: approvalTools,
        preload: true,
      },
    ],
    ...(attachSkills
      ? {
          skills: [
            { name: "spokeo" },
            { name: "peoplefind" },
            { name: "clearbook" },
            { name: "exposure-score" },
          ],
        }
      : {}),
    config: {
      sandbox: { enabled: attachSkills },
      generativeUi: { enabled: generativeUi },
      askUserQuestions: { enabled: false },
      dynamicSubAgents: { enabled: process.env.UNDOX_ONESHOT !== "true" },
      iterationLimit: Number(process.env.UNDOX_ITERATION_LIMIT ?? 40),
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
