---
name: peoplefind
description: Opt out of PeopleFind fixture broker listings used in Undox Double-O demos. Use for prepare/submit against local fixture HTML.
---

# PeopleFind (fixture broker)

## Identity
- **Broker id:** `peoplefind`
- **Display name:** PeopleFind (demo fixture)
- **People-search URL:** `http://127.0.0.1:8792/peoplefind/` (via `npm run fixtures:serve`)
- **Opt-out URL:** `http://127.0.0.1:8792/peoplefind/optout.html`

## Entry flow
1. `find_broker_listing` / `find_all_broker_listings` → fixture profile URL.
2. `run_sandbox_prepare` with broker=`peoplefind` (runs `src/sandbox/peoplefind-prepare-optout.ts`).
3. `submit_opt_out` with `mode=mock` → human approval on exact PII.

## Required form fields

| Form field | Maps from |
|---|---|
| listing_id | listing.profileUrl |
| contact_email | pii.email |
| full_name | pii.name |
| home_address | pii.address |
| phone | pii.phone |
| dob | pii.dob |

## Sandbox / automation notes
- Prepare script: `src/sandbox/peoplefind-prepare-optout.ts`
- Prefer MCP `run_sandbox_prepare` so the prepare script process is visible in the demo.

## Safety
Submission MUST go through `submit_opt_out`. Never `mode=live` in demos.
