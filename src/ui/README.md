# Generative UI — exposure dashboard

Undox enables TrueForge **Generative UI** on the orchestrator (`config.generativeUi.enabled`).

## What the agent should render

After `get_exposure_dashboard(session_id)`, ask the model to emit OpenUI / Generative UI blocks for:

1. **Risk header** — `riskLabel` + `riskScore` + one-line `summary`
2. **Broker status cards** — one row per broker (`found` → `prepared` → `submitted`)
3. **Timeline** — last events from the session store

Tool payload shape (from MCP):

```json
{
  "sessionId": "demo-…",
  "riskScore": 84,
  "riskLabel": "high",
  "brokers": [{ "broker": "spokeo", "status": "submitted", "profileUrl": "…" }],
  "timeline": [{ "at": "…", "event": "broker.submitted", "detail": "spokeo" }],
  "summary": "3 broker(s) tracked · risk high (84) · session demo-…"
}
```

## Fallback

If Generative UI is flaky on a local Ollama model, set `UNDOX_GENERATIVE_UI=false` and have the agent print the same JSON as a markdown table. The Double-O / Savile Row beat still works via the tool result + approval modal.

## Approval copy

`submit_opt_out` is approval-gated. The modal must show **literal** `name`, `address`, `phone`, `dob`, `email` — that is the Savile Row moment; do not redact in the UI.
