# Architecture (PR1)

```
User → TrueForge orchestrator → undox-tools MCP
         ├─ find_broker_listing (fixture)
         ├─ prepare_opt_out / sandbox prepare script
         └─ submit_opt_out  ← approval gate (exact PII) → mock submit
```

Later PRs add subagent fan-out, session-resume proof, Generative UI, Gmail
confirmation polling, and demo fixture brokers.
