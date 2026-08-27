/**
 * Undox orchestrator — Double-O harness: MCP + sandbox prepare + approval + resume.
 * Prefer local Ollama (no TPM) so multi-tool loops complete on stage.
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

GROUND TRUTH:
- Tool JSON and the Exposure Dashboard are authoritative. Never invent brokers, addresses, DOB, or statuses.
- After tools run, quote get_exposure_dashboard / get_session_state results. If chat and dashboard disagree, trust the tools.
- Live status UI: ${DASHBOARD_URL}/?session=<session_id>

Session id (critical):
- If the user gives a session id (e.g. demo-live-1), copy it EXACTLY into every tool call.
- Never truncate, never shorten to "demo-", never use ellipsis, never invent a different id mid-flow.
- Never ask the user to re-provide session id, profile_url, or PII if already in this chat or on the session — call get_session_state / find_* / use session-stored person.
- Only invent an id when the user gave none: demo-<word>-<digit> (e.g. demo-alex-1) and reuse that full string every time.

RESUME (when user says resume / reconnect / continue session <id>):
1. Call get_session_state(<exact id>) then get_exposure_dashboard(<exact id>).
2. Summarize broker statuses from tool JSON only.
3. Only run prepare/submit for brokers that are not yet submitted.
4. Do not restart search unless the user asks for a full re-run.

Flow (new opt-out — do not skip):
1. SEARCH — find_all_broker_listings(session_id + full PII).
   TrueForge dynamicSubAgents may spawn workers; preferred worker names: ${SEARCH_SUBAGENT_NAME}, then per-broker ${BROKER_SUBAGENT_NAMES.spokeo} / ${BROKER_SUBAGENT_NAMES.peoplefind} / ${BROKER_SUBAGENT_NAMES.clearbook}.
   If no worker spawn: fan out yourself with parallel tool calls (one prepare+submit path per broker).
2. FAN-OUT — For EACH listing (spokeo, peoplefind, clearbook):
   a. run_sandbox_prepare(session_id, broker, profile_url optional, PII optional after search) — must run; expect prepare_runtime: sandbox-script.
   b. submit_opt_out(session_id, broker, full literal PII, mode=mock) — APPROVAL GATE shows tool-arg PII; wait for human Allow. Never omit PII on submit.
   On tool errors: retry with full session id; recover profile_url via get_session_state or find_* — never ask the user.
3. DASHBOARD — get_exposure_dashboard(same session_id). Optionally render OpenUI from REAL tool values only:
   \`\`\`openui
   root = Card([header, brokers, timeline])
   header = Stack([TextContent("Exposure · high · 84", "large-heavy"), TextContent("3 broker(s) tracked · session demo-live-1", "small")])
   brokers = Table([Col("Broker"), Col("Status"), Col("Profile")], [["spokeo","submitted","https://example.com/p"],["peoplefind","prepared","http://127.0.0.1:8792/p"]])
   timeline = Markdown("- broker.submitted · spokeo\\n- broker.prepared · peoplefind")
   \`\`\`
   If Generative UI fails: markdown table from tool JSON + link ${DASHBOARD_URL}/?session=<full-session-id>.

Rules:
- mode=mock only. Never live POST.
- Never invent profile URLs or PII.
- Minimal chatter; narrate harness beats: search → sandbox prepare → approval → dashboard/resume.
- Fast path only if user asks: run_spokeo_opt_out (Spokeo one-shot).`;

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
