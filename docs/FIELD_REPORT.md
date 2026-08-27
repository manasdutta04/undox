# Field Report — Undox: approval-gated broker opt-outs on TrueForge

**Hackathon:** WeMakeDevs × TrueFoundry × Qodo (Agent Harness)  
**Track focus:** Best Use of TrueForge (Double-O / NVIDIA DGX Spark). Secondary: Qodo code-quality trail (Q Branch / Mac Mini). UI is evidence of state, not the product.

**Live demo:** https://olive-dealt-infections-projectors.trycloudflare.com/?session=demo-test-2  
(dashboard + fixtures + MCP; approval/kill-resume on the 3‑min video)

## Problem

People-search brokers republish names, addresses, phones, and dates of birth. Removal is tedious, error-prone, and often irreversible once you hit Submit. Humans deserve a harness that **finds**, **prepares**, then **pauses** with the exact payload before anything leaves the machine — a job people already pay privacy services to do.

## What we built (the heart — few features, fully working)

**Undox** is a TrueForge orchestrator wired to a custom MCP server (`undox-tools`):

| Primitive | How Undox uses it |
|---|---|
| MCP tools | `find_*`, `run_sandbox_prepare`, `submit_opt_out`, `get_session_state`, `get_exposure_dashboard` |
| Sandbox + skills | Broker skills with prepare scripts; tool results show `prepare_runtime: sandbox-script` |
| Approval | `submit_opt_out` / `run_spokeo_opt_out` require Allow on **literal** PII |
| Subagents | `dynamicSubAgents` enabled + worker instruction contracts; fallback = parallel tool fan-out |
| Sessions | File-backed store keyed by `session_id` — kill TrueForge, statuses remain |
| Status UI | Exposure Dashboard (public `/` or local `:8793`) fed by the same store (chat prose is not authoritative) |

Demo brokers **PeopleFind** and **Clearbook** are static fixtures so demos never depend on live CAPTCHAs. Spokeo uses real URL mapping; submit stays **mock** on stage.

## Why harness beats matter

A thin chat wrapper that calls one mock function is not a harness story. Judges need to see the agent **do work**: broker fan-out, sandboxed prepare, a real approval gate, and state that survives reconnect. Undox is intentionally fixture-first so those beats are reliable on video.

## Demo proof (what we film)

1. Dual-pane: TrueForge left (tools + Allow on Alex Rivera fixture PII) · dashboard right.  
2. Kill TrueForge → restart → same `session_id` still shows submitted brokers.  
3. Live URL: open `/?session=demo-test-2` → risk high + three SUBMITTED cards + fixture links.  
4. Offline backup: `npm run prove:heart` / `demo:multi-broker` if the LLM flakes.

## Safety

Mock submit by default. No live PII in the repo or demo video. CAPTCHA and phone walls escalate to humans — never bypassed.

## Qodo + CI

Every substantive slice ships as a PR with `/agentic_review`. See README **Qodo Code Review Evidence**. CI runs `typecheck`, `test`, and `prove:heart` on every PR (`.github/workflows/ci.yml`).

## Clone path

README stranger path: Ollama + TrueForge (WSL) + MCP HTTP + fixtures + dashboard + `npm run register:agent` — or single `npm run serve:public`. Trust dashboard/tools over chat summaries.
