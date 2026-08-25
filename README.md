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
| Model id | `llama-3.3-70b-versatile` or `llama-3.1-8b-instant` |

```bash
UNDOX_MODEL=custom/llama-3.3-70b-versatile
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
3. Model `llama-3.3-70b-versatile`
4. Set `UNDOX_MODEL` in `.env`

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

Required for every submission (Best Code Quality track). After the first
Qodo-reviewed PR merges, fill this in:

- **Representative PR:** _link to a merged PR with meaningful Undox code_
- **What Qodo found / what we did:** _1–2 sentences — fixed High findings, or dismissed with reason_
- **Review trail:** the PR conversation must show the completed Qodo review, our decisions, and a follow-up review on the final code

Until then: install Qodo on this repo and open the next change as a PR (not a direct `main` push). See [`CONTRIBUTING.md`](./CONTRIBUTING.md).
