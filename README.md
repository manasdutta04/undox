# Undox

[![Live demo](https://img.shields.io/badge/Live_demo-Vercel-000?style=for-the-badge)](https://undox.vercel.app/app?session=demo-test-2)
[![GitHub](https://img.shields.io/badge/GitHub-undox-181717?style=for-the-badge&logo=github)](https://github.com/manasdutta04/undox)
[![CI](https://img.shields.io/github/actions/workflow/status/manasdutta04/undox/ci.yml?branch=main&style=for-the-badge&label=CI)](https://github.com/manasdutta04/undox/actions)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

TrueForge agent that finds data-broker sites leaking a person's PII and drives
opt-outs — with **human approval before every submission**.

| | |
|---|---|
| **Live demo** | https://undox.vercel.app/app?session=demo-test-2 |
| **Connect MCP** | https://undox.vercel.app/app/connect — copy JSON as-is (`undox-demo-public`) |
| Landing | https://undox.vercel.app/ |
| API · fixtures · MCP | https://undox-demo.onrender.com · [`/mcp`](https://undox-demo.onrender.com/mcp) · [`/healthz`](https://undox-demo.onrender.com/healthz) |

Proof path: **Exposure → Brokers → Approval → Connect**. Source of truth = tool JSON + dashboard, not chat.

Docs: [`FIELD_REPORT`](./docs/FIELD_REPORT.md) · [`WEB_DEPLOY`](./docs/WEB_DEPLOY.md) · [`CONTRIBUTING`](./CONTRIBUTING.md)

### Ops notes

- **Cold start:** Render free tier sleeps after ~15 min idle; first API load may take ~1 minute. Optional keep-warm: ping `/healthz` every 10 min ([UptimeRobot](https://uptimerobot.com)).
- **MCP:** public demo Bearer `undox-demo-public` (mock submits). Optional private `UNDOX_MCP_TOKEN` for ops. Rotate after the hackathon.
- **Video:** Approval gate + kill/resume shown in the project video (TrueForge Allow on literal PII). Hosting TrueForge + Ollama publicly is out of scope.

## How Undox uses TrueForge

| Primitive | Undox wiring |
|---|---|
| **MCP tools** | Custom `undox-tools` HTTP MCP: find → `run_sandbox_prepare` → approval-gated `submit_opt_out`; plus `get_session_state` / `get_exposure_dashboard` |
| **Sandbox + skills** | Skills `spokeo`, `peoplefind`, `clearbook`, `exposure-score`; prepare scripts under `src/sandbox/` |
| **Approval** | `submit_opt_out` and `run_spokeo_opt_out` require human Allow on **literal** PII |
| **Subagents** | `config.dynamicSubAgents.enabled`; fallback = parallel MCP tool fan-out |
| **Sessions** | File store keyed by `session_id` — survives TrueForge restart |
| **Status UI** | Next.js on Vercel (`web/`) + session API on Render — same store as MCP |

**Stack:** Vercel UI (`web/`, neo-brutal) proxies `/backend/*` to Render. Render serves `/api/*`, `/fixtures/*`, `/mcp`. TrueForge (local) uses the Connect paste. Submit is mock on stage.

## Brokers

| Broker | Role |
|---|---|
| **Spokeo** | Real opt-out URL mapping; CAPTCHA escalates to human; submit **mock** in demo |
| **PeopleFind** | Fixture under `fixtures/demo-brokers/peoplefind` |
| **Clearbook** | Fixture under `fixtures/demo-brokers/clearbook` |

## Free stack (no paid keys)

| Piece | Free choice | Notes |
|---|---|---|
| LLM | **[Ollama](https://ollama.com)** local (`gemma4:e2b`) | Need native `tool_calls` |
| Agent harness | **TrueForge** (`npx @truefoundry/trueforge`) | MIT, local SQLite |
| Product UI | **[Vercel](https://vercel.com)** (`web/`) | Next.js 15 |
| Public API host | **[Render](https://render.com)** free web service | Blueprint in `render.yaml` |
| Broker search | Fixtures via Undox MCP | Reliable on stage |
| Opt-out submit | **Mock** | Live POST disabled for demo |
| Code review | **[Qodo](https://github.com/marketplace/qodo-merge-pro)** | Best Code Quality eligibility |

## Local fallback (clone path)

Needs Node **≥ 22.14**, Ollama with a tool-calling model, and TrueForge in **WSL2** on Windows.

```bash
cp .env.example .env
npm install
npm test && npm run prove:heart

# WSL — TrueForge
HOST=0.0.0.0 npx @truefoundry/trueforge@latest --port 8790

# Host — public API stack (fixtures + API + MCP)
UNDOX_MCP_TOKEN=dev-secret UNDOX_MCP_DEMO_TOKEN=undox-demo-public npm run serve:public   # :8080

# Next UI (separate terminal)
cd web && npm install
NEXT_PUBLIC_UNDOX_API_URL=http://127.0.0.1:8080 npm run dev   # :3000
```

Connect TrueForge → paste from `/app/connect` (or local `:8080/mcp` with your Bearer). Register: `UNDOX_ATTACH_SKILLS=true UNDOX_MODEL=ollama/gemma4-e2b npm run register:agent`

Demo prompt:

```
Session id demo-double-o-1. Remove Alex Rivera's PII (demo): name Alex Rivera, address 123 Maple Ave Austin TX 78701, phone +1-512-555-0142, dob 1990-04-12, email alex.rivera.optout@example.com. Use mode=mock.
```

### Offline (no LLM)

```bash
npm run prove:heart
npm run demo:approval-gate
npm run demo:multi-broker
```

### Deploy your own

**UI:** Vercel root `web` — [`docs/WEB_DEPLOY.md`](./docs/WEB_DEPLOY.md).  
**API:** Render Blueprint from [`render.yaml`](render.yaml); set `UNDOX_WEB_URL` + `UNDOX_MCP_DEMO_TOKEN=undox-demo-public`.

## Safety

- Demo submits are **mock** (`mode=live` rejected).
- CAPTCHA / phone walls escalate to humans.
- Fixture identity only in repo / video / live seed.
- No keys or real PII in the repo or submission video.

## Qodo Code Review Evidence

- **Primary PR:** https://github.com/manasdutta04/undox/pull/4 — Double-O deepen; Qodo High/Medium resolved.
- **Render deploy:** https://github.com/manasdutta04/undox/pull/8 — Blueprint + public URL; Qodo resolved.
- **Earlier:** [#3](https://github.com/manasdutta04/undox/pull/3), [#1](https://github.com/manasdutta04/undox/pull/1).
- Process: `/agentic_review` on every substantive PR → fix → squash merge. No direct pushes to `main`.
- CI: `typecheck`, `test`, `prove:heart` on every PR.

## Field write-up

See [`docs/FIELD_REPORT.md`](./docs/FIELD_REPORT.md).

## AI assistance disclosure

Built with AI coding assistants (Cursor) during the hackathon. Architecture, broker choice, approval-gate design, and merges are owned and verified by the team (hackathon rules 12–14).
