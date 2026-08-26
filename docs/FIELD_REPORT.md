# Field Report — Undox: approval-gated broker opt-outs on TrueForge

**Hackathon:** WeMakeDevs × TrueFoundry × Qodo (Agent Harness)  
**Track focus:** Best Use of TrueForge (Double-O / DGX), with Qodo review trail and a Savile Row–ready approval UI.

## Problem

People-search brokers republish names, addresses, phones, and dates of birth. Removal is tedious, error-prone, and often irreversible once you hit Submit. Humans deserve a harness that **finds**, **prepares**, then **pauses** with the exact payload before anything leaves the machine.

## What we built

**Undox** is a TrueForge orchestrator wired to a custom MCP server (`undox-tools`):

| Primitive | How Undox uses it |
|---|---|
| MCP tools | `find_*`, `run_sandbox_prepare`, `submit_opt_out`, `get_session_state`, `get_exposure_dashboard` |
| Sandbox + skills | Broker skills (`spokeo`, `peoplefind`, `clearbook`) with prepare scripts |
| Approval | `submit_opt_out` / `run_spokeo_opt_out` require Allow on literal PII |
| Subagents | `dynamicSubAgents` enabled; search + per-broker fan-out instructions |
| Sessions | File-backed session store keyed by `session_id` — kill/restart resume |
| Generative UI | Exposure dashboard from `get_exposure_dashboard` |

Demo brokers **PeopleFind** and **Clearbook** are static fixtures (`npm run fixtures:serve`) so stage demos never depend on live CAPTCHAs.

## Why harness beats matter

A thin chat wrapper that calls one mock function is not a harness story. Judges need to see the agent **do work**: parallel broker paths, sandboxed prepare, a real approval gate, and state that survives reconnect. Undox is intentionally fixture-first so those beats are reliable on video.

## Safety

Mock submit by default. No live PII in the repo or demo video. CAPTCHA and phone walls escalate to humans — never bypassed.

## Qodo

Every substantive slice ships as a PR with `/agentic_review`. See README **Qodo Code Review Evidence** (PR #3 and follow-ons).

## Clone path

README: Ollama + TrueForge (WSL) + MCP HTTP + fixture server + `npm run register:agent` — stranger-ready in under 15 minutes.
