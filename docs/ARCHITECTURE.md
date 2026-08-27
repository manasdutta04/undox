# Architecture (Double-O)

```
User → TrueForge undox-orchestrator
         ├─ dynamicSubAgents (optional workers) OR parallel MCP tool calls
         ├─ Search → find_all_broker_listings / find_broker_listing
         ├─ Broker fan-out (spokeo | peoplefind | clearbook)
         │    ├─ run_sandbox_prepare  ← prepare *.ts script process
         │    │                         (prepare_runtime: sandbox-script)
         │    └─ submit_opt_out       ← approval gate (exact PII) → mock
         ├─ get_exposure_dashboard    ← OpenUI optional; dashboard :8793 is truth
         └─ get_session_state         ← kill TrueForge / resume proof
```

**Worker contracts** live in `src/agents/search-subagent.ts` and `src/agents/broker-subagent.ts`.
They are instruction templates for TrueForge `dynamicSubAgents`, not separately registered saved agents.
If the model does not spawn workers, the orchestrator still completes the job via parallel tool calls.

Session state persists in `UNDOX_SESSION_STORE` (default `.undox-session-state.json`), keyed by the same `session_id` chats reuse. Stopping TrueForge while MCP + store stay up is the resume beat.

Fixture brokers: `fixtures/demo-brokers/` served by `npm run fixtures:serve`.

**Ground truth:** MCP tool JSON + Exposure Dashboard. Chat summaries from small local models may invent fields — ignore them for judging.

Live Spokeo CAPTCHA bypass and multi-broker SaaS scope are **non-goals**.
