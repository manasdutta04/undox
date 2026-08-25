---
name: broker-adapter-template
description: Template for adding a new data-broker opt-out skill. Copy this folder, rename it, and fill every required section before wiring the broker into Undox.
---

# Broker adapter skill template

Use this file as the checklist for every new broker under `skills/brokers/<broker>/SKILL.md`.

## Required sections

### 1. Identity
- **Broker id** (slug): e.g. `spokeo`
- **Display name**: e.g. `Spokeo`
- **People-search URL**: where listings appear
- **Opt-out URL**: dedicated removal / suppression page

### 2. Entry flow
Describe the path from "person's name" to "ready-to-submit form":
1. Search / locate listing (URL pattern if known)
2. Open opt-out page (or in-listing remove control)
3. Any intermediate steps (account creation, CCPA state select, etc.)

### 3. Required form fields
Table of fields the site asks for and how to map Undox `PiiPayload`:

| Form field | Required? | Maps from | Notes |
|---|---|---|---|
| profile_url | yes | listing.profileUrl | |
| email | yes | pii.email | confirmation inbox |
| … | | | |

Always preserve the full PII set (`name`, `address`, `phone`, `dob`, `email`) for the **approval gate**, even if the broker only POSTs a subset.

### 4. Confirmation pattern
- On-page success message (exact or approximate text)
- Confirmation email: sender domain, subject pattern, link TTL
- Expected time-to-confirmation (e.g. 24–48 hours)

### 5. Retry / resubmission cadence
- If no confirmation by T+N, what to do (re-check listing, resubmit, escalate to human)
- Reappearance window (many brokers re-list in 6–12 months)

### 6. CAPTCHA / rate-limit / blockers
- CAPTCHA present? → **stop and flag the human; never bypass**
- Phone verification? → flag human
- Account wall / paid removal? → flag human
- Known rate limits or IP blocks

### 7. Sandbox / automation notes
- Selectors or DOM landmarks for the opt-out form (if automating)
- Reference prepare script path under `src/sandbox/`
- Whether live POST is allowed yet (`mock` vs `live`)

### 8. Safety
- Submission MUST go through `submit_opt_out` so TrueForge can show the exact PII payload and pause for approval.
- Never submit without human Allow on the approval gate.
