# Undox

TrueForge agent that finds data-broker sites leaking a person's PII and drives
opt-outs — with **human approval before every submission**.

> How we ship (PRs + Qodo): [`CONTRIBUTING.md`](./CONTRIBUTING.md)  
> Architecture notes: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)

**PR1 status:** repo scaffold + one Spokeo adapter end-to-end (fixture search →
prepare → approval-gated **mock** submit). Live broker POSTs, subagent fan-out,
and the dashboard come in later PRs.

## Broker choice (PR1)

**Spokeo** — simplest major-broker opt-out we audited:

| Broker | Opt-out friction |
|---|---|
| **Spokeo** (chosen) | Profile URL + email + CAPTCHA + email confirm |
| Whitepages | Phone verification callback |
| BeenVerified | Search → select → email confirm (heavier flow) |
| Radaris | Account wall |
| MyLife | Flaky form / email fallback |

CAPTCHA is flagged to the human (never bypassed). Submission is **mocked** in PR1.

## Free stack (no paid keys)

| Piece | Free choice | Notes |
|---|---|---|
| LLM | **[Groq](https://console.groq.com)** | Free tier, no credit card. OpenAI-compatible. |
| Agent harness | **TrueForge** (`npx @truefoundry/trueforge`) | MIT, local SQLite |
| Sandbox | **TrueForge local sandbox** on WSL/Linux/macOS | No Daytona required for PR1 |
| Broker search (PR1) | **Fixture** via `undox-tools` | Later: Exa in TrueForge catalog (no auth) |
| Opt-out submit (PR1) | **Mock** | Live POST is a later PR |
| Email confirm (PR6) | Free Gmail + OAuth MCP | Not needed until PR6 |
| Demo brokers (PR7) | Static HTML in-repo | Zero cost |
| Code review | **[Qodo](https://github.com/marketplace/qodo-merge-pro)** free plan | Install day one — Best Code Quality |
| Git hosting | Public GitHub repo | Required for Qodo + judges |

### Groq in TrueForge (Settings → Models)

Add a **custom** OpenAI-compatible provider:

| Field | Value |
|---|---|
| Type | `custom` (OpenAI-compatible) |
| Base URL | `https://api.groq.com/openai/v1` |
| API key | from [console.groq.com](https://console.groq.com) (free) |
| Model id | `openai/gpt-oss-120b` (preferred) or `openai/gpt-oss-20b` (faster / lighter) |

```bash
UNDOX_MODEL=custom/openai/gpt-oss-120b
```

(Use the exact FQN shown in the TrueForge model selector after you save the provider.)

### Windows note

Run TrueForge in **WSL2** with **Node ≥ 22.14**. Native Windows currently crashes in TrueForge v0.1.4 (`Received protocol 'c:'`). Undox’s `npm run demo:approval-gate` / tests run fine on Windows.

## Prerequisites

- Node.js **≥ 22.14** (WSL/Linux/macOS for TrueForge)
- Free **Groq** API key
- **Qodo** GitHub App on this repo (see CONTRIBUTING.md)

## Setup — TrueForge local mode

### 1. Install Undox deps

```bash
cd undox
cp .env.example .env
npm install
```

### 2. Boot TrueForge

```bash
npx @truefoundry/trueforge@latest --port 8790
```

Open **http://localhost:8790**.

### 3. Connect Groq (free)

1. **Settings → Models → Add** custom OpenAI-compatible provider
2. Base URL `https://api.groq.com/openai/v1` + Groq API key
3. Model id `openai/gpt-oss-120b`
4. Set `UNDOX_MODEL` in `.env` (e.g. `custom/openai/gpt-oss-120b` — use the FQN shown in the selector). Scripts load `.env` via Node `--env-file=.env`.

### 4. Register the Undox MCP connector

**Settings → Connectors → Add MCP Server**

| Field | Value |
|---|---|
| Name | `undox-tools` (must match exactly) |
| Transport | stdio |
| Command | `npx` |
| Args | `tsx` `src/mcp/undox-tools/server.ts` |
| Working directory | absolute path to this `undox` repo |

### 5. Enable the Spokeo skill (after repo is on GitHub)

**Settings → Skills → Import from GitHub** → this repo, path `skills/brokers/spokeo`, ref `main`.

Or register without skills first:

```bash
UNDOX_ATTACH_SKILLS=false npm run register:agent
```

### 6. Register the orchestrator

```bash
npm run register:agent
```

### 7. Fire the approval gate

Open **Agents Library → undox-orchestrator** and send demo PII. Pause on
`submit_opt_out`, confirm name/address/phone/DOB, **Allow** → mock submitted.

## Offline approval-gate demo (no LLM)

```bash
npm run demo:approval-gate
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run mcp:undox-tools` | Start Undox MCP (stdio) |
| `npm run sandbox:spokeo-prepare` | Run Spokeo prepare script |
| `npm run register:agent` | Create/update `undox-orchestrator` |
| `npm run demo:approval-gate` | Offline approval-gate demo |
| `npm test` | Unit tests |
| `npm run typecheck` | TypeScript check |

## Safety

- No live PII is posted to Spokeo in PR1 (`mode=live` is rejected).
- CAPTCHA / phone walls are human-escalation only.
- Use demo/fixture identity data unless you intentionally opt out yourself.

## Qodo Code Review Evidence

- **Representative PR:** https://github.com/manasdutta04/undox/pull/1  
  (`docs: use Groq openai/gpt-oss-120b as default model`)
- **What Qodo found / what we did:** Qodo flagged a Medium correctness bug — `UNDOX_MODEL` in `.env` was ignored because scripts ran `tsx` without loading the env file. We switched npm scripts to `node --env-file=.env --import tsx`, replied on the finding thread, and re-ran `/agentic_review`; Qodo marked the finding **Resolved**.
- **Review trail:** initial `/agentic_review` → finding + fix commit → thread reply → follow-up review against `490e8e1` → squash merge to `main`.

## AI assistance disclosure

This project was built with AI coding assistants (Cursor) during the hackathon.
Architecture, broker choice, approval-gate design, and all merges are owned and
verified by the team (hackathon rules 12–14).
