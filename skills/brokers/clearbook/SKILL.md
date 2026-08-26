---
name: clearbook
description: Opt out of Clearbook fixture broker listings used in Undox Double-O demos. Use for prepare/submit against local fixture HTML.
---

# Clearbook (fixture broker)

## Identity
- **Broker id:** `clearbook`
- **Display name:** Clearbook (demo fixture)
- **People-search URL:** `http://127.0.0.1:8792/clearbook/`
- **Opt-out URL:** `http://127.0.0.1:8792/clearbook/optout.html`

## Entry flow
1. Locate fixture listing via Undox MCP find tools.
2. `run_sandbox_prepare` with broker=`clearbook` → `src/sandbox/clearbook-prepare-optout.ts`.
3. `submit_opt_out` `mode=mock` → approval gate with literal PII.

## Required form fields

| Form field | Maps from |
|---|---|
| profile | listing.profileUrl |
| email | pii.email |
| name | pii.name |
| address | pii.address |
| mobile | pii.phone |
| birthdate | pii.dob |

## Sandbox / automation notes
- Prepare script: `src/sandbox/clearbook-prepare-optout.ts`
- Demo uses mock submit only.

## Safety
Never bypass the TrueForge approval modal. Never POST live PII in the demo video.
