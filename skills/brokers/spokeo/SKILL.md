---
name: spokeo
description: Opt out of Spokeo people-search listings. Use when Undox needs to locate a Spokeo profile and prepare or submit a Spokeo removal request with human approval.
---

# Spokeo broker skill

## Identity
- **Broker id:** `spokeo`
- **Display name:** Spokeo
- **People-search URL:** https://www.spokeo.com
- **Opt-out URL:** https://www.spokeo.com/optout

## Why Spokeo is the PR1 target
Spokeo's opt-out is one of the simplest among major people-search brokers: paste the **profile URL**, enter an **email**, complete CAPTCHA, then confirm via email. No phone callback (unlike Whitepages) and no mandatory account wall (unlike Radaris). That keeps the first end-to-end loop reviewable.

## Entry flow
1. Search Spokeo for the person's full name + city/state.
2. Open the matching profile and copy the canonical profile URL  
   (pattern roughly: `https://www.spokeo.com/<Name>/<ST>/<City>/p…`).
3. Go to https://www.spokeo.com/optout.
4. Paste profile URL + email, solve CAPTCHA, submit.
5. Click the confirmation link Spokeo emails.

## Required form fields

| Form field | Required? | Maps from | Notes |
|---|---|---|---|
| profile_url | yes | listing.profileUrl | Exact listing URL |
| email | yes | pii.email | Used for confirmation link |
| CAPTCHA | yes | — | **Human only — never automate bypass** |

Carry the full approval payload even if Spokeo does not POST every field:

| Approval field | Source |
|---|---|
| name | pii.name |
| address | pii.address |
| phone | pii.phone |
| dob | pii.dob |
| email | pii.email |

## Confirmation pattern
- **On-page:** acknowledgment after submit that a confirmation email was sent.
- **Email:** from a Spokeo domain; subject typically references opt-out / removal; contains a one-time confirmation link.
- **Time-to-confirmation:** usually within 24–48 hours after the link is clicked (policy can change — treat as approximate).

## Retry / resubmission cadence
- If no confirmation email within **48 hours**, re-check the inbox (spam), then re-prepare and re-submit with a fresh approval.
- Re-check the listing after **7 days**; if still live, escalate to the human with the profile URL.
- Expect possible reappearance in **6–12 months**; schedule a revisit.

## CAPTCHA / rate-limit / blockers
- CAPTCHA is present on the opt-out form → **stop and ask the human**; do not attempt to solve or bypass.
- If the profile is paywalled and the URL cannot be obtained, ask the human for the URL or skip Spokeo for this run.
- On repeated failures / blocks, pause and report rather than retrying in a tight loop.

## Sandbox / automation notes
- Prepare script: `src/sandbox/spokeo-prepare-optout.ts` (also exposed as MCP `prepare_opt_out`).
- Builds `formFields` + full `pii` for the approval gate; does **not** submit.
- **PR1 mode:** `submit_opt_out` with `mode=mock` only — logs the payload and marks session status `submitted`. Live HTTP POST is intentionally disabled.

## Safety
1. Call `find_broker_listing` (or real search in a later PR) → status `found`.
2. Call `prepare_opt_out` → status `prepared`.
3. Call `submit_opt_out` with the **exact** PII fields → TrueForge pauses → human Allow/Deny.
4. On Allow in mock mode → status `submitted` (confirmation polling is PR6).
