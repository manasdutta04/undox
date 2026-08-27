# Undox demo script (3 minutes) — Double-O / Savile Row

Narrate **harness beats**, not product fluff. Use **fixture identity only** (never real PII on camera).

**Film layout:** TrueForge chat on the **left** (tools / approval / fan-out); Exposure Dashboard on the **right** (`http://127.0.0.1:8793/?session=…`). Dashboard + tool JSON are ground truth.

## Prep (before recording)

1. Ollama up with a tool-calling model (`gemma4:e2b` recommended).
2. TrueForge in WSL: `npx @truefoundry/trueforge --port 8790`
3. Windows terminals:
   - `npm run fixtures:serve` → `http://127.0.0.1:8792/`
   - `npm run dashboard:serve` → `http://127.0.0.1:8793/?session=demo-double-o-1`
   - `UNDOX_MCP_HOST=0.0.0.0 UNDOX_MCP_TOKEN=… npm run mcp:undox-tools:http`
4. Connector `undox-tool` → Windows host IP `:8791/mcp` with **header** auth (`Authorization: Bearer <same UNDOX_MCP_TOKEN>`). TrueForge uses `auth.type: "header"` (singular). Or: `UNDOX_MCP_TOKEN=… node --import tsx scripts/fix-trueforge-mcp-auth.ts`
5. Remove any stale connector named `undox-tools` that points at `127.0.0.1` (unreachable from WSL).
6. Import skills: `spokeo`, `peoplefind`, `clearbook`, `exposure-score`
7. `UNDOX_ATTACH_SKILLS=true UNDOX_MODEL=ollama/gemma4-e2b npm run register:agent`
8. Note a session id you will reuse: e.g. `demo-double-o-1` (open the same id in the dashboard).

## Beat map

| Time | Say | Show |
|---|---|---|
| 0:00–0:20 | Privacy exposure is a real job people pay for. Undox is a TrueForge agent that finds broker listings and opts out — with human approval. | Repo + TrueForge + dashboard shell |
| 0:20–0:50 | **Fan-out:** orchestrator runs search then prepare/submit across Spokeo + two fixture brokers (`dynamicSubAgents` and/or parallel tools). | Tool spans; dashboard brokers appear as `found` → `prepared` |
| 0:50–1:20 | **Sandbox:** prepare runs as a sandbox script (`run_sandbox_prepare`), not a silent server stub. | MCP log / `prepare_runtime: sandbox-script`; dashboard → `prepared` |
| 1:20–1:50 | **Approval:** pause on the exact PII payload. Read name/address/phone/DOB aloud. Allow. | TrueForge approval modal (literal PII) |
| 1:50–2:20 | **Session resume:** kill TrueForge process, restart, reopen the **same** session id. | Dashboard still shows statuses; `get_session_state` |
| 2:20–2:45 | **UI:** risk score + per-broker cards + timeline (local dashboard and/or Generative UI). | Right pane live cards; optional OpenUI in chat |
| 2:45–3:00 | Fixture vs live; Qodo PR trail. Clone from README in &lt;15 minutes. | README Qodo evidence |

## Kill / restart resume (mandatory)

1. After at least one broker is `submitted`, note `session_id`.
2. Stop TrueForge (Ctrl+C). Keep MCP + fixtures + **dashboard** running (session store is on disk: `.undox-session-state.json`).
3. Restart TrueForge; open the same chat/session if UI restores it, or start a new turn with:  
   `Resume session demo-double-o-1 — call get_session_state and get_exposure_dashboard.`
4. Screen-capture statuses intact on **both** panes.

## Offline dry-run (no LLM)

```bash
npm run demo:approval-gate
npm run demo:multi-broker
npm run dashboard:serve
# open http://127.0.0.1:8793/?session=<id printed by demo>
```

## Do not film

- Live Spokeo CAPTCHA bypass
- Real personal data
- API keys or `.env` contents
