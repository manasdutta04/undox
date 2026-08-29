# Undox

[![Live demo](https://img.shields.io/badge/Live_demo-Vercel-000?style=for-the-badge)](https://undox-demo.vercel.app/app?session=demo-test-2)
[![GitHub](https://img.shields.io/badge/GitHub-undox-181717?style=for-the-badge&logo=github)](https://github.com/manasdutta04/undox)
[![CI](https://img.shields.io/github/actions/workflow/status/manasdutta04/undox/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/manasdutta04/undox/actions)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

TrueForge agent that finds data-broker sites leaking a person's PII and drives
opt-outs — with **human approval before every submission**.

## Live demo (no clone required)

| What | URL |
|---|---|
| **App** (start here) | https://undox-demo.vercel.app/app?session=demo-test-2 |
| Landing | https://undox-demo.vercel.app/ |
| **Connect MCP** (TrueForge) | https://undox-demo.vercel.app/app/connect |
| API · fixtures · MCP | https://undox-demo.onrender.com |
| Fixtures | https://undox-demo.onrender.com/fixtures/peoplefind/ · [/clearbook/](https://undox-demo.onrender.com/fixtures/clearbook/) · [/spokeo/](https://undox-demo.onrender.com/fixtures/spokeo/) |
| Health | https://undox-demo.onrender.com/healthz |
| MCP (Bearer) | `https://undox-demo.onrender.com/mcp` |

> **Render free tier:** the API sleeps after ~15 min idle; **first load may take up to ~1 minute**. Optional keep-warm: ping `/healthz` every 10 min with [UptimeRobot](https://uptimerobot.com) (free). Set `UNDOX_CORS_ORIGINS` on Render to your Vercel URL — see [`docs/WEB_DEPLOY.md`](./docs/WEB_DEPLOY.md).

MCP requires a Bearer token (`UNDOX_MCP_TOKEN`). Dashboard/fixture verification does **not** need it; rotate tokens if shared outside your team. Do not publish live tokens in the repo.

**Approval gate + kill/resume** are demonstrated in the project video (TrueForge Allow on literal PII). Hosting TrueForge + Ollama publicly is out of scope for the free demo stack.

> Field report: [`docs/FIELD_REPORT.md`](./docs/FIELD_REPORT.md) · Web deploy: [`docs/WEB_DEPLOY.md`](./docs/WEB_DEPLOY.md) · Shipping process: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

**Status:** Double-O harness demo — multi-broker MCP (Spokeo + 2 fixtures), sandbox prepare scripts, `dynamicSubAgents` + parallel tool fan-out, approval gate, session resume, Exposure Dashboard. **Source of truth = tool JSON + dashboard, not chat prose.**

## How Undox uses TrueForge

| Primitive | Undox wiring |
|---|---|
| **MCP tools** | Custom `undox-tools` HTTP MCP: find → `run_sandbox_prepare` → approval-gated `submit_opt_out`; plus `get_session_state` / `get_exposure_dashboard` |
| **Sandbox + skills** | Skills `spokeo`, `peoplefind`, `clearbook`, `exposure-score`; prepare scripts under `src/sandbox/` (`prepare_runtime: sandbox-script`) |
| **Approval** | `submit_opt_out` and `run_spokeo_opt_out` require human Allow on **literal** PII |
| **Subagents** | `config.dynamicSubAgents.enabled`; worker instruction contracts in `src/agents/*-subagent.ts`. Fallback = parallel MCP tool fan-out |
| **Sessions** | File store keyed by `session_id` — kill TrueForge, keep MCP, statuses remain |
| **Status UI** | Next.js app on Vercel (`web/`) + `/api/session/:id` on Render; same session store as MCP |

### Architecture (short)

**Vercel** serves the landing page and `/app/*` workspace (light UI; `/backend/*` proxies session API + fixtures). **Render** (`scripts/serve-public.ts`) serves `/api/*`, `/fixtures/*`, and `/mcp`. TrueForge (local) talks to MCP over HTTP with Bearer auth — use in-app **Connect** for the connector JSON. Prepare runs sandbox scripts; submit is mock on stage. The dashboard reads the same JSON session store — chat is not authoritative.

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
| Product UI | **[Vercel](https://vercel.com)** (`web/`) | Next.js 15 |
| Public API host | **[Render](https://render.com)** free web service | Blueprint in `render.yaml` |
| Broker search | Fixtures via Undox MCP | Reliable on stage |
| Opt-out submit | **Mock** | Live POST intentionally disabled for demo |
| Code review | **[Qodo](https://github.com/marketplace/qodo-merge-pro)** | Best Code Quality eligibility |

## Local fallback (clone path)

Needs Node **≥ 22.14**, Ollama with a tool-calling model, and TrueForge in **WSL2** on Windows (native Windows TrueForge v0.1.4 crashes on `c:` protocol).

```bash
cp .env.example .env
npm install
npm test && npm run prove:heart

# WSL — TrueForge
HOST=0.0.0.0 npx @truefoundry/trueforge@latest --port 8790

# Host — public API stack (fixtures + API + MCP)
UNDOX_MCP_TOKEN=dev-secret npm run serve:public   # :8080

# Next UI (separate terminal)
cd web && npm install
NEXT_PUBLIC_UNDOX_API_URL=http://127.0.0.1:8080 npm run dev   # :3000

# Or API-only local helper:
npm run dashboard:serve         # :8793 (API only)
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

### Deploy your own

**UI (Vercel):** root directory `web`, set `NEXT_PUBLIC_UNDOX_API_URL` — see [`docs/WEB_DEPLOY.md`](./docs/WEB_DEPLOY.md).

**API (Render — free):**

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → connect this repo.
2. Render reads [`render.yaml`](render.yaml), creates `undox-demo`, builds Docker, deploys.
3. Set `UNDOX_WEB_URL` and `UNDOX_CORS_ORIGINS` to your Vercel URL.
4. Copy `UNDOX_MCP_TOKEN` from Render **Environment** — share only via private channels (never commit).
5. Open `https://<your-vercel-app>/app?session=demo-test-2`.

Optional backup: [`Dockerfile`](Dockerfile) + [`fly.toml`](fly.toml) for Fly.io.

## Safety

- Demo submits are **mock** (`mode=live` rejected).
- CAPTCHA / phone walls escalate to humans.
- Fixture identity only in repo / video / live seed.
- No keys or real PII in the repo or submission video.

## Qodo Code Review Evidence

- **Primary PR:** https://github.com/manasdutta04/undox/pull/4  
  (`feat: Double-O deepen — multi-broker, sandbox, subagents, resume, UI`)  
  Qodo High/Medium findings resolved before squash merge.
- **Render deploy:** https://github.com/manasdutta04/undox/pull/8 — Blueprint + public URL fixes; Qodo resolved before merge.
- **Earlier:** https://github.com/manasdutta04/undox/pull/3 — HTTP MCP + Ollama path; High/Medium fixed.
- **Earlier:** https://github.com/manasdutta04/undox/pull/1 — Medium env-load bug; resolved.
- Process: `/agentic_review` on every substantive PR → fix → re-review → squash merge. No direct pushes to `main`.
- CI: `.github/workflows/ci.yml` runs `typecheck`, `test`, and `prove:heart` on every PR.

## Field write-up

See [`docs/FIELD_REPORT.md`](./docs/FIELD_REPORT.md) — problem, TrueForge primitives, demo proof, safety, Qodo/CI.

## AI assistance disclosure

Built with AI coding assistants (Cursor) during the hackathon. Architecture, broker choice, approval-gate design, and merges are owned and verified by the team (hackathon rules 12–14).
