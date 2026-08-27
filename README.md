# Undox

TrueForge agent that finds data-broker sites leaking a person's PII and drives
opt-outs — with **human approval before every submission**.

> How we ship (PRs + Qodo): [`CONTRIBUTING.md`](./CONTRIBUTING.md)  
> Architecture: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)  
> Stage demo: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md)  
> Field report draft: [`docs/FIELD_REPORT.md`](./docs/FIELD_REPORT.md)  
> Submit pack: [`docs/SUBMISSION_CHECKLIST.md`](./docs/SUBMISSION_CHECKLIST.md)

**Status:** Double-O harness demo — multi-broker MCP (Spokeo + 2 fixtures), sandbox prepare scripts, `dynamicSubAgents` + parallel tool fan-out, approval gate, session resume, Exposure Dashboard. **Source of truth = tool JSON + dashboard, not chat prose** (small local models may invent text).

## How Undox uses TrueForge

| Primitive | Undox wiring |
|---|---|
| **MCP tools** | Custom `undox-tools` HTTP MCP: find → `run_sandbox_prepare` → approval-gated `submit_opt_out`; plus `get_session_state` / `get_exposure_dashboard` |
| **Sandbox + skills** | Skills `spokeo`, `peoplefind`, `clearbook`, `exposure-score`; prepare scripts under `src/sandbox/` (`prepare_runtime: sandbox-script`) |
| **Approval** | `submit_opt_out` and `run_spokeo_opt_out` require human Allow on **literal** PII |
| **Subagents** | `config.dynamicSubAgents.enabled`; worker instruction contracts in `src/agents/*-subagent.ts`. If no worker spawns, the orchestrator fans out with parallel MCP tool calls |
| **Sessions** | File store `.undox-session-state.json` keyed by `session_id` — kill TrueForge, keep MCP, statuses remain |
| **Generative UI** | Optional OpenUI; **Exposure Dashboard** at `:8793` is the reliable status surface |

## Brokers

| Broker | Role |
|---|---|
| **Spokeo** | Real opt-out URL mapping; CAPTCHA escalates to human; submit is **mock** in demo |
| **PeopleFind** | Local fixture (`fixtures/demo-brokers/peoplefind`) |
| **Clearbook** | Local fixture (`fixtures/demo-brokers/clearbook`) |

CAPTCHA is flagged to the human (never bypassed). Live POSTs stay off unless you explicitly opt in later — demos use `mode=mock`.

## Free stack (no paid keys)

| Piece | Free choice | Notes |
|---|---|---|
| LLM | **[Ollama](https://ollama.com)** local (`gemma4:e2b`) | No cloud TPM; need native `tool_calls` |
| LLM fallback | Groq / Gemini free tiers | Easy to hit rate limits on multi-tool loops — use `UNDOX_ONESHOT=true` |
| Agent harness | **TrueForge** (`npx @truefoundry/trueforge`) | MIT, local SQLite |
| Sandbox | **TrueForge local sandbox** on WSL/Linux/macOS | Required when skills are attached |
| Broker search | Fixture via Undox MCP + `npm run fixtures:serve` | Reliable on stage |
| Opt-out submit | **Mock** | Live POST intentionally disabled for hackathon video |
| Code review | **[Qodo](https://github.com/marketplace/qodo-merge-pro)** | Best Code Quality eligibility |
| Git hosting | Public GitHub | Required for Qodo + judges |

### Ollama in TrueForge (recommended)

1. `ollama pull gemma4:e2b` (prefer models with native `tool_calls`)
2. If TrueForge runs in **WSL**, point Ollama at the Windows host IP:

```bash
# from WSL
ip route show | awk '/default/{print $3}'
UNDOX_OLLAMA_HOST=<that-ip> node --env-file=.env --import tsx scripts/configure-ollama-provider.ts
```

3. `UNDOX_MODEL=ollama/gemma4-e2b`

### Windows note

Run TrueForge in **WSL2** with **Node ≥ 22.14**. Native Windows currently crashes in TrueForge v0.1.4 (`Received protocol 'c:'`). Undox MCP HTTP, fixtures, and tests run fine on Windows.

## Prerequisites

- Node.js **≥ 22.14** (WSL/Linux/macOS for TrueForge)
- **Ollama** with a tool-calling model
- **Qodo** GitHub App on this repo

## Setup — stranger path (&lt;15 minutes)

### 1. Install

```bash
cd undox
cp .env.example .env
npm install
npm test && npm run prove:heart
```

### 2. Boot TrueForge (WSL / Node ≥ 22)

```bash
# WSL example — put nvm Node 22 first on PATH
export PATH="$HOME/.nvm/versions/node/v22.23.2/bin:/usr/bin:/bin"
cd /mnt/c/path/to/undox
npx @truefoundry/trueforge@latest --port 8790
```

Open **http://localhost:8790**.

### 3. Fixtures + dashboard + MCP (Windows or same host)

```bash
npm run fixtures:serve          # :8792
npm run dashboard:serve         # :8793
# Loopback (TrueForge on same OS):
npm run mcp:undox-tools:http
# WSL TrueForge → Windows MCP:
UNDOX_MCP_HOST=0.0.0.0 UNDOX_MCP_TOKEN=dev-secret npm run mcp:undox-tools:http
# then (Windows): UNDOX_MCP_TOKEN=dev-secret node --import tsx scripts/fix-trueforge-mcp-auth.ts
```

Open: **http://127.0.0.1:8793/?session=demo-double-o-1**

### 4. Connect MCP in TrueForge

| Field | Value |
|---|---|
| Name | `undox-tool` (must match `UNDOX_MCP_NAME`) |
| URL | `http://127.0.0.1:8791/mcp` or Windows host IP from WSL (e.g. `http://172.x.x.x:8791/mcp`) |
| Auth | `header` type with `Authorization: Bearer <UNDOX_MCP_TOKEN>` when MCP is non-loopback |

Remove any stale connector named `undox-tools` pointing at `127.0.0.1` if TrueForge runs in WSL.

### 5. Import skills (optional)

**Settings → Skills → Import from GitHub** → paths:

- `skills/brokers/spokeo`
- `skills/brokers/peoplefind`
- `skills/brokers/clearbook`
- `skills/reporting/exposure-score`

Or register without skills: `UNDOX_ATTACH_SKILLS=false npm run register:agent`

### 6. Register orchestrator

```bash
UNDOX_ATTACH_SKILLS=true UNDOX_MODEL=ollama/gemma4-e2b npm run register:agent
```

### 7. Demo turn

Open **Agents Library → undox-orchestrator**. Paste:

```
Session id demo-double-o-1. Remove Alex Rivera's PII (demo): name Alex Rivera, address 123 Maple Ave Austin TX 78701, phone +1-512-555-0142, dob 1990-04-12, email alex.rivera.optout@example.com. Use mode=mock.
```

Watch: find → sandbox prepare → **Allow** on exact PII → dashboard cards flip to `submitted`.  
**Trust the dashboard / tool JSON**, not invented chat summaries.  
Then kill TrueForge only → restart → `Resume session demo-double-o-1 — call get_session_state and get_exposure_dashboard.`

Full film beats: [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md).

## Offline demos (no LLM)

```bash
npm run prove:heart
npm run demo:approval-gate
npm run demo:multi-broker
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run fixtures:serve` | Static PeopleFind / Clearbook sites (`:8792`) |
| `npm run dashboard:serve` | Exposure Dashboard UI (`:8793`) |
| `npm run mcp:undox-tools` | Undox MCP (stdio) |
| `npm run mcp:undox-tools:http` | Undox MCP (HTTP for TrueForge) |
| `npm run sandbox:spokeo-prepare` | Spokeo prepare script |
| `npm run register:agent` | Create/update `undox-orchestrator` |
| `npm run prove:heart` | Offline heart + disk resume check |
| `npm run demo:approval-gate` | Spokeo approval-gate offline |
| `npm run demo:multi-broker` | 3-broker + dashboard offline |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check |

## Safety

- Demo submits are **mock** (`mode=live` rejected).
- CAPTCHA / phone walls escalate to humans.
- Use fixture identity unless you intentionally opt out yourself.
- No keys or real PII in the repo or submission video.

## Qodo Code Review Evidence

- **Primary PR:** https://github.com/manasdutta04/undox/pull/4  
  (`feat: Double-O deepen — multi-broker, sandbox, subagents, resume, UI`)  
  Qodo raised High/Medium findings (failed prepare marked ready, fixture `.env` load, directory `index.html`, URI decode crash, slashless redirect); all marked **Resolved** before squash merge.
- **Earlier substantive PR:** https://github.com/manasdutta04/undox/pull/3 — HTTP MCP + Ollama path; High/Medium (loopback defaults, token for non-loopback, PII match, log redaction) fixed.
- **Earlier PR:** https://github.com/manasdutta04/undox/pull/1 — Medium env-load bug; resolved via `node --env-file=.env --import tsx`.
- Process: `/agentic_review` on every substantive PR → fix → thread reply → re-review → squash merge. No direct pushes to `main`.
- CI: `.github/workflows/ci.yml` runs `typecheck`, `test`, and `prove:heart` on every PR.

## AI assistance disclosure

Built with AI coding assistants (Cursor) during the hackathon. Architecture, broker choice, approval-gate design, and merges are owned and verified by the team (hackathon rules 12–14).
