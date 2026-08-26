# Architecture (Double-O)

```
User → TrueForge orchestrator (dynamic subagents + generative UI)
         ├─ Search path → find_all_broker_listings / find_broker_listing
         ├─ Broker fan-out (spokeo | peoplefind | clearbook)
         │    ├─ run_sandbox_prepare  ← prepare *.ts script process
         │    └─ submit_opt_out       ← approval gate (exact PII) → mock
         ├─ get_exposure_dashboard    ← Generative UI / status cards
         └─ get_session_state         ← kill/restart resume proof
```

Session state persists in `UNDOX_SESSION_STORE` (default `.undox-session-state.json`), keyed by the same `session_id` TrueForge chats reuse.

Fixture brokers: `fixtures/demo-brokers/` served by `npm run fixtures:serve`.

Live Spokeo CAPTCHA bypass and multi-broker SaaS scope are **non-goals**.
