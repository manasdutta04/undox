# Undox

TrueForge agent that finds data-broker sites leaking a person's PII and drives
opt-outs — with **human approval before every submission**.

## Live demo (no clone required)

Judges can verify the Exposure Dashboard, broker fixtures, and MCP heart without local setup:

| What | URL |
|---|---|
| **Dashboard** (seeded `demo-test-2`, risk 100 / all submitted) | https://olive-dealt-infections-projectors.trycloudflare.com/?session=demo-test-2 |
| Fixtures | https://olive-dealt-infections-projectors.trycloudflare.com/fixtures/peoplefind/ · [/clearbook/](https://olive-dealt-infections-projectors.trycloudflare.com/fixtures/clearbook/) |
| Health | https://olive-dealt-infections-projectors.trycloudflare.com/healthz |
| MCP (Bearer) | `https://olive-dealt-infections-projectors.trycloudflare.com/mcp` |

Demo MCP token (rotate after hackathon): `demo-judge-token`

**Approval gate + kill/resume** need the ~3‑minute dual-pane video (TrueForge Allow on literal PII). Hosting TrueForge + Ollama publicly is out of scope this week.

> Field report: [`docs/FIELD_REPORT.md`](./docs/FIELD_REPORT.md) · Shipping process: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

**Status:** Double-O harness demo — multi-broker MCP (Spokeo + 2 fixtures), sandbox prepare scripts, `dynamicSubAgents` + parallel tool fan-out, approval gate, session resume, Exposure Dashboard. **Source of truth = tool JSON + dashboard, not chat prose.**

## How Undox uses TrueForge

| Primitive | Undox wiring |
|---|---|
| **MCP tools** | Custom `undox-tools` HTTP MCP: find → `run_sandbox_prepare` → approval-gated `submit_opt_out`; plus `get_session_state` / `get_exposure_dashboard` |
| **Sandbox + skills** | Skills `spokeo`, `peoplefind`, `clearbook`, `exposure-score`; prepare scripts under `src/sandbox/` (`prepare_runtime: sandbox-script`) |
| **Approval** | `submit_opt_out` and `run_spokeo_opt_out` require human Allow on **literal** PII |
| **Subagents** | `config.dynamicSubAgents.enabled`; worker instruction contracts in `src/agents/*-subagent.ts`. Fallback = parallel MCP tool fan-out |
| **Sessions** | File store keyed by `session_id` — kill TrueForge, keep MCP, statuses remain |
| **Status UI** | Public `/` dashboard (or local `:8793`); same session store as MCP |

### Architecture (short)

One public Node process (`scripts/serve-public.ts`) serves dashboard + `/api/session/:id` + `/fixtures/*` + `/mcp`. TrueForge (local) talks to MCP over HTTP with Bearer auth. Prepare runs sandbox scripts; submit is mock on stage. Dashboard reads the same JSON session store — chat is not authoritative.

## Brokers

| Broker | Role |
|---|---|
| **Spokeo** | Real opt-out URL mapping; CAPTCHA escalates to human; submit is **mock** in demo |
| **PeopleFind** | Fixture under `fixtures/demo-brokers/peoplefind` |
| **Clearbook** | Fixture under `fixtures/demo-brokers/clearbook` |

CAPTCHA is flagged to the human (never bypassed). Live POSTs stay off unless you explicitly opt in later — demos use `mode=mock`.

## Free stack (no paid keys)

| Piece | Free choice | Notes |
|---|---|---|
| LLM | **[Ollama](https://ollama.com)** local (`gemma4:e2b`) | Need native `tool_calls` |
| Agent harness | **TrueForge** (`npx @truefoundry/trueforge`) | MIT, local SQLite |
| Broker search | Fixtures via Undox MCP | Reliable on stage |
| Opt-out submit | **Mock** | Live POST intentionally disabled for hackathon video |
| Code review | **[Qodo](https://github.com/marketplace/qodo-merge-pro)** | Best Code Quality eligibility |

## Local fallback (clone path)

Needs Node **≥ 22.14**, Ollama with a tool-calling model, and TrueForge in **WSL2** on Windows (native Windows TrueForge v0.1.4 crashes on `c:` protocol).

```bash
cp .env.example .env
npm install
npm test && npm run prove:heart

# WSL — TrueForge
HOST=0.0.0.0 npx @truefoundry/trueforge@latest --port 8790

# Host — one-shot public stack (or split fixtures/dashboard/MCP)
UNDOX_MCP_TOKEN=dev-secret npm run serve:public   # :8080

# Or split:
npm run fixtures:serve          # :8792
npm run dashboard:serve         # :8793
UNDOX_MCP_HOST=0.0.0.0 UNDOX_MCP_TOKEN=dev-secret npm run mcp:undox-tools:http
```

Connect TrueForge MCP connector `undox-tool` → `http://<host>:8791/mcp` (or `:8080/mcp`) with `auth.type: "header"` and `Authorization: Bearer <token>`. Helper: `scripts/fix-trueforge-mcp-auth.ts`.

Register: `UNDOX_ATTACH_SKILLS=true UNDOX_MODEL=ollama/gemma4-e2b npm run register:agent`

Demo prompt (Agents Library → undox-orchestrator):

```
Session id demo-double-o-1. Remove Alex Rivera's PII (demo): name Alex Rivera, address 123 Maple Ave Austin TX 78701, phone +1-512-555-0142, dob 1990-04-12, email alex.rivera.optout@example.com. Use mode=mock.
```

Trust dashboard / tool JSON over chat. Resume: `Resume session demo-double-o-1 — call get_session_state and get_exposure_dashboard.`

### Offline (no LLM)

```bash
npm run prove:heart
npm run demo:approval-gate
npm run demo:multi-broker
```

### Deploy your own (Fly.io)

```bash
fly auth login
fly apps create undox-demo   # if needed
fly volumes create undox_data --region iad --size 1
fly secrets set UNDOX_MCP_TOKEN=… UNDOX_PUBLIC_URL=https://undox-demo.fly.dev
fly deploy
```

`Dockerfile` + `fly.toml` ship dashboard, fixtures, and MCP on one `PORT`. Seed session `demo-test-2` is baked in at build.

## Safety

- Demo submits are **mock** (`mode=live` rejected).
- CAPTCHA / phone walls escalate to humans.
- Fixture identity only in repo / video / live seed.
- No keys or real PII in the repo or submission video.

## Qodo Code Review Evidence

- **Primary PR:** https://github.com/manasdutta04/undox/pull/4  
  (`feat: Double-O deepen — multi-broker, sandbox, subagents, resume, UI`)  
  Qodo High/Medium findings resolved before squash merge.
- **Earlier:** https://github.com/manasdutta04/undox/pull/3 — HTTP MCP + Ollama path; High/Medium fixed.
- **Earlier:** https://github.com/manasdutta04/undox/pull/1 — Medium env-load bug; resolved.
- Process: `/agentic_review` on every substantive PR → fix → re-review → squash merge. No direct pushes to `main`.
- CI: `.github/workflows/ci.yml` runs `typecheck`, `test`, and `prove:heart` on every PR.

## Field write-up

See [`docs/FIELD_REPORT.md`](./docs/FIELD_REPORT.md) — problem, TrueForge primitives, demo proof, safety, Qodo/CI.

## AI assistance disclosure

Built with AI coding assistants (Cursor) during the hackathon. Architecture, broker choice, approval-gate design, and merges are owned and verified by the team (hackathon rules 12–14).
