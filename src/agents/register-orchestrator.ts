/**
 * Registers (or updates) the Undox orchestrator agent on a running TrueForge server.
 *
 * Prerequisites:
 *   1. `npx @truefoundry/trueforge` is up at TRUEFORGE_BASE_URL
 *   2. A model provider is configured; UNDOX_MODEL matches a usable model FQN
 *   3. Connector named `undox-tools` is added (see README)
 *   4. Skill `spokeo` is enabled (see README / catalogs/skill-catalog.yaml)
 */

import { TrueForge } from "@truefoundry/trueforge-sdk";
import { ORCHESTRATOR_NAME, registerOrchestrator } from "./orchestrator.js";

async function main() {
  const baseUrl = process.env.TRUEFORGE_BASE_URL ?? "http://localhost:8790";
  const model = process.env.UNDOX_MODEL ?? "ollama/gemma4-e2b";
  const token = process.env.TRUEFORGE_TOKEN;

  const client = new TrueForge({
    baseUrl,
    ...(token ? { token } : {}),
    timeoutInSeconds: 120,
  });

  const result = await registerOrchestrator(client, model);
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: result.created ? "created" : "updated",
        agent: ORCHESTRATOR_NAME,
        id: result.id,
        model,
        baseUrl,
        next: `Open ${baseUrl}, pick agent "${ORCHESTRATOR_NAME}", and ask it to remove your (demo) PII from Spokeo.`,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("Failed to register orchestrator:", err);
  process.exit(1);
});
