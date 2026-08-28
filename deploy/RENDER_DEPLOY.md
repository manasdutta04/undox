# Render deploy (one-time)

After [`render.yaml`](../render.yaml) is on `main`:

1. Open https://dashboard.render.com → **New** → **Blueprint**.
2. Connect GitHub repo `manasdutta04/undox` (branch `main`).
3. Apply the Blueprint — service name `undox-demo`, plan **Free**.
4. Wait for Docker build + deploy (first build ~5–10 min).
5. In Render → **undox-demo** → **Environment**, copy `UNDOX_MCP_TOKEN` → **hackathon submission form only** (never README/git).
6. Verify:
   - https://undox-demo.onrender.com/healthz
   - https://undox-demo.onrender.com/case?session=demo-test-2 (risk 100, 3 submitted)
   - https://undox-demo.onrender.com/brokers?session=demo-test-2 (fixture listing links)
   - https://undox-demo.onrender.com/approval?session=demo-test-2 (PII approval preview)
   - https://undox-demo.onrender.com/fixtures/spokeo/profile.html?name=Alex%20Rivera

If the name `undox-demo` is taken globally, rename in `render.yaml` and redeploy.

**Optional keep-warm (free):** [UptimeRobot](https://uptimerobot.com) HTTP monitor on `/healthz` every 10 minutes.

## Submission form fields

| Field | Value |
|---|---|
| Repo | https://github.com/manasdutta04/undox |
| Live demo | https://undox-demo.onrender.com/case?session=demo-test-2 |
| MCP (optional) | https://undox-demo.onrender.com/mcp + Bearer token (private) |
| Video | ~3 min: TrueForge Allow + dashboard + kill/resume |
| Write-up | README + docs/FIELD_REPORT.md |
