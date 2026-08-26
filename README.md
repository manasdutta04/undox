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
| LLM | **[Ollama](https://ollama.com)** local (`gemma4:e2b`) | No cloud TPM; use a model with native `tool_calls` |
| LLM fallback | Groq / Gemini free tiers | Easy to hit rate limits on multi-tool loops |
| Agent harness | **TrueForge** (`npx @truefoundry/trueforge`) | MIT, local SQLite |
| Sandbox | **TrueForge local sandbox** on WSL/Linux/macOS | No Daytona required for PR1 |
| Broker search (PR1) | **Fixture** via Undox MCP | Later: Exa in TrueForge catalog (no auth) |
| Opt-out submit (PR1) | **Mock** (`run_spokeo_opt_out`) | Live POST is a later PR |
| Email confirm (PR6) | Free Gmail + OAuth MCP | Not needed until PR6 |
| Demo brokers (PR7) | Static HTML in-repo | Zero cost |
| Code review | **[Qodo](https://github.com/marketplace/qodo-merge-pro)** free plan | Install day one — Best Code Quality |
| Git hosting | Public GitHub repo | Required for Qodo + judges |

### Ollama in TrueForge (recommended free path)

1. Install [Ollama](https://ollama.com) and pull a tool-capable model: `ollama pull gemma4:e2b`  
   (`qwen2.5-coder:7b` often prints JSON instead of native tool calls.)
2. If TrueForge runs in **WSL**, point the provider at the Windows host IP (not `127.0.0.1`):

```bash
# from WSL
ip route show | awk '/default/{print $3}'
UNDOX_OLLAMA_HOST=<that-ip> node --env-file=.env --import tsx scripts/configure-ollama-provider.ts
```

3. Set:

```bash
UNDOX_MODEL=ollama/gemma4-e2b
```

### Windows note

Run TrueForge in **WSL2** with **Node ≥ 22.14**. Native Windows currently crashes in TrueForge v0.1.4 (`Received protocol 'c:'`). Undox’s `npm run demo:approval-gate` / MCP HTTP server / tests run fine on Windows.

## Prerequisites

- Node.js **≥ 22.14** (WSL/Linux/macOS for TrueForge)
- **Ollama** with `gemma4:e2b` (or another model that emits native tool calls)
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

### 3. Connect Ollama (free / local)

1. Keep Ollama running on the host
2. Configure the TrueForge custom provider (or run `scripts/configure-ollama-provider.ts`)
3. Set `UNDOX_MODEL=ollama/gemma4-e2b` in `.env`. Scripts load `.env` via Node `--env-file=.env`.

### 4. Register the Undox MCP connector

TrueForge’s UI only accepts **remote URL** MCP servers (not stdio).

**Terminal A** — keep this running on **Windows** (from the repo):

```bash
npm run mcp:undox-tools:http
```

You should see it bound on `127.0.0.1:8791` by default (loopback-only).  
For WSL→Windows access:

```bash
UNDOX_MCP_HOST=0.0.0.0 UNDOX_MCP_TOKEN=dev-secret npm run mcp:undox-tools:http
```

Then point TrueForge at `http://<windows-host-ip>:8791/mcp` and send the same token (Bearer or `x-undox-mcp-token`).

**TrueForge UI** — Settings → Connectors → **Add MCP Server**:

| Field | Value |
|---|---|
| Name | `undox-tool` (must match `UNDOX_MCP_NAME`) |
| Description | Undox broker find / prepare / approval-gated mock submit |
| URL | `http://127.0.0.1:8791/mcp` (or Windows host IP from WSL) |
| Auth type | **None** on loopback; token header when using `UNDOX_MCP_TOKEN` |

Leave API key / header empty. Save.

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
