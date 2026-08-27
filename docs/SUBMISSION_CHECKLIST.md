# Submission pack checklist

Recording and social posting are manual — this repo ships the scripts and drafts.

## Before submit

- [ ] Heart verified offline: `npm test && npm run prove:heart`
- [ ] Live dual-pane once: dashboard shows three brokers `submitted` for your film `session_id`
- [ ] Kill/resume once: stop TrueForge only → restart → `get_session_state` / dashboard still match
- [ ] Record 3-minute demo following [`DEMO_SCRIPT.md`](./DEMO_SCRIPT.md) (approval + kill/restart mandatory; dual-pane with Exposure Dashboard)
- [ ] No real PII / keys / `.env` on camera — use Alex Rivera fixture only
- [ ] If the model invents chat text (“Anytown”, truncated session ids), **keep filming the dashboard/tools** — that is ground truth
- [ ] Publish or attach [`FIELD_REPORT.md`](./FIELD_REPORT.md) for Field Report prize
- [ ] Cut 1–2 clips from [`SOCIAL_CLIPS.md`](./SOCIAL_CLIPS.md) (include approval modal + live dashboard); tag WeMakeDevs / TrueFoundry / Qodo
- [ ] README stranger path verified cold (&lt;15 min) including `dashboard:serve`
- [ ] Qodo evidence links current (PR #4 primary; #3 / #1 secondary); CI green on latest PR

## Recording recipe (exact)

1. Left: TrueForge `undox-orchestrator` chat (Clear chat first).  
2. Right: `http://127.0.0.1:8793/?session=<your-film-id>`.  
3. Paste the demo turn from README §7 (or DEMO_SCRIPT).  
4. Narrate: search → sandbox prepare → Allow literal PII → dashboard.  
5. Kill TrueForge (Ctrl+C); keep MCP + fixtures + dashboard; restart TrueForge; resume same session id.  
6. Stop at ~3:00. Export MP4 privately (do not commit).

## Video file

Place the final MP4 outside the repo or in a private drive link — do **not** commit large binaries.
