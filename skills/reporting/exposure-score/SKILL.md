---
name: exposure-score
description: Build Undox exposure / risk dashboard from session broker statuses. Call get_exposure_dashboard after finds and submits; render Generative UI cards.
---

# Exposure score / dashboard

1. After broker work, call MCP `get_exposure_dashboard(session_id)`.
2. Render Generative UI (or a clear markdown table) with:
   - `riskLabel` + `riskScore`
   - Per-broker status (`found` / `prepared` / `submitted` / …)
   - Short `timeline`
3. On session resume, call again and compare — statuses must persist.

Scoring (fixture heuristic in `src/agents/exposure-dashboard.ts`): open listings weigh more than count alone; labels are low / medium / high.
