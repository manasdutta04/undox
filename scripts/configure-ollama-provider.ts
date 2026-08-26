/**
 * Configure Ollama models for TrueForge (WSL-safe host IP).
 * Prefers gemma4:e2b — qwen2.5-coder:7b prints tools as JSON text, not tool_calls.
 */

import { TrueForge } from "@truefoundry/trueforge-sdk";
import { registerOrchestrator } from "../src/agents/orchestrator.js";

const baseUrl = process.env.TRUEFORGE_BASE_URL ?? "http://localhost:8790";
const host = process.env.UNDOX_OLLAMA_HOST ?? "127.0.0.1";
const ollamaBase = `http://${host}:11434/v1`;
const model = process.env.UNDOX_MODEL ?? "ollama/gemma4-e2b";

const client = new TrueForge({ baseUrl });

await client.settings.modelProviders.createOrUpdate({
  manifest: {
    type: "custom",
    name: "ollama",
    baseUrl: ollamaBase,
    auth: { apiKey: "ollama" },
    models: [
      {
        modelId: "gemma4:e2b",
        name: "gemma4-e2b",
        properties: {
          contextLength: 32768,
          maxOutputTokens: 8192,
          reasoningEfforts: ["none"],
        },
      },
      {
        modelId: "qwen2.5-coder:7b",
        name: "qwen2-5-coder-7b",
        properties: {
          contextLength: 32768,
          maxOutputTokens: 8192,
          reasoningEfforts: ["none"],
        },
      },
    ],
  },
});

const agent = await registerOrchestrator(client, model);
console.log(
  JSON.stringify(
    {
      ok: true,
      ollamaBase,
      model,
      agent: agent.name,
      id: agent.id,
      note: "Use ollama/gemma4-e2b for native tool_calls; qwen2.5-coder:7b only emits JSON text.",
    },
    null,
    2,
  ),
);
