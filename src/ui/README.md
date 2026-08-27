# Generative UI + local Exposure Dashboard

Undox enables TrueForge **Generative UI** on the orchestrator (`config.generativeUi.enabled`) and ships a **local dashboard** for reliable stage demos.

## Local dashboard (Savile Row beat)

```bash
npm run dashboard:serve
# http://127.0.0.1:8793/?session=demo-double-o-1
```

Polls the same `UNDOX_SESSION_STORE` file the MCP writes. Film this beside TrueForge chat: risk score, broker status strip, timeline.

| Endpoint | Purpose |
|---|---|
| `GET /` | Exposure page |
| `GET /api/session/:id` | Dashboard JSON (`found`, risk, brokers, timeline) |
| `GET /api/sessions` | Session id picker |

## Generative UI (in TrueForge chat)

After `get_exposure_dashboard(session_id)`, the orchestrator should emit OpenUI using built-ins, e.g.:

````openui
root = Card([header, brokers, timeline])
header = Stack([TextContent("Exposure · high · 84", "large-heavy"), TextContent("3 broker(s) tracked · session demo-live-1", "small")])
brokers = Table([Col("Broker"), Col("Status"), Col("Profile")], [["spokeo","submitted","https://…"],["peoplefind","prepared","http://…"]])
timeline = Markdown("- broker.submitted · spokeo\n- broker.prepared · peoplefind")
````

If Generative UI is flaky on a small Ollama model, set `UNDOX_GENERATIVE_UI=false` and point judges at the local dashboard URL.

## Approval copy

`submit_opt_out` is approval-gated. The modal must show **literal** `name`, `address`, `phone`, `dob`, `email` — that is the Savile Row moment; do not redact.
