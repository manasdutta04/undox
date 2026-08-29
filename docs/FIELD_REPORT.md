# Field Report — Undox: approval-gated broker opt-outs on TrueForge

**Hackathon:** WeMakeDevs × TrueFoundry × Qodo (Agent Harness)  
**Track focus:** Best Use of TrueForge (Double-O / NVIDIA DGX Spark). Secondary: Qodo code-quality trail. UI is evidence of state, not the product.

**Live demo:** https://undox.vercel.app/app?session=demo-test-2  
**Connect MCP:** https://undox.vercel.app/app/connect (paste-ready; Bearer `undox-demo-public`)

**Proof path (one pass):** open Exposure (risk + broker cards) → Brokers (fixture listings) → Approval (literal PII preview) → Connect (copy MCP into TrueForge). Same session store as MCP — chat is not authoritative. Render free tier may sleep (~1 min first API hit).

## Problem

People-search brokers republish names, addresses, phones, and dates of birth. Removal is tedious and often irreversible once you hit Submit. Humans need a harness that **finds**, **prepares**, then **pauses** with the exact payload before anything leaves the machine.

## What we built

**Undox** is a TrueForge orchestrator wired to custom MCP (`undox-tools`):

| Primitive | How Undox uses it |
|---|---|
| MCP tools | `find_*`, `run_sandbox_prepare`, `submit_opt_out`, `get_session_state`, `get_exposure_dashboard` |
| Sandbox + skills | Broker skills with prepare scripts (`prepare_runtime: sandbox-script`) |
| Approval | `submit_opt_out` / `run_spokeo_opt_out` require Allow on **literal** PII |
| Subagents | `dynamicSubAgents` + parallel tool fan-out fallback |
| Sessions | File store keyed by `session_id` — survives TrueForge restart |
| Status UI | Vercel dashboard + Render API; same store as MCP |

Demo brokers **PeopleFind** and **Clearbook** are fixtures (no live CAPTCHA). Spokeo uses real URL mapping; submit stays **mock**.

## Why harness beats matter

Judges need the agent to **do work**: broker fan-out, sandboxed prepare, a real approval gate, and state that survives reconnect. Fixture-first keeps those beats reliable on video.

## Demo proof (what we film)

1. Dual-pane: TrueForge (tools + Allow on Alex Rivera PII) · dashboard right.  
2. Kill TrueForge → restart → same `session_id` still shows submitted brokers.  
3. Live URL proof path above (`demo-test-2`).  
4. Offline backup: `npm run prove:heart` / `demo:multi-broker` if the LLM flakes.

## Safety

Mock submit by default. No live PII in the repo or demo video. CAPTCHA and phone walls escalate to humans — never bypassed.

## Qodo + CI

Every substantive slice ships as a PR with `/agentic_review`. CI runs `typecheck`, `test`, and `prove:heart` on every PR.

## Clone path

README: Ollama + TrueForge (WSL) + `npm run serve:public` + `cd web && npm run dev`. Trust dashboard/tools over chat.
