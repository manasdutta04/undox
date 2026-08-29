# Render deploy (one-time)

After [`render.yaml`](../render.yaml) is on `main`:

1. Open https://dashboard.render.com → **New** → **Blueprint**.
2. Connect GitHub repo `manasdutta04/undox` (branch `main`).
3. Apply the Blueprint — service name `undox-demo`, plan **Free**.
4. Wait for Docker build + deploy (first build ~5–10 min).
5. Confirm env includes `UNDOX_MCP_DEMO_TOKEN=undox-demo-public` and `UNDOX_WEB_URL=https://undox.vercel.app`.
6. Verify:
   - https://undox-demo.onrender.com/healthz
   - https://undox.vercel.app/app/exposure?session=demo-test-2 (risk 100, 3 submitted)
   - https://undox.vercel.app/app/brokers?session=demo-test-2 (fixture listing links)
   - https://undox.vercel.app/app/approval?session=demo-test-2 (PII approval preview)
   - https://undox.vercel.app/app/connect (Copy MCP config → TrueForge)
   - https://undox-demo.onrender.com/fixtures/spokeo/profile.html?name=Alex%20Rivera

| Name | Example |
|---|---|
| `UNDOX_WEB_URL` | `https://undox.vercel.app` |
| `UNDOX_CORS_ORIGINS` | `https://undox.vercel.app,http://localhost:3000` |
| `UNDOX_MCP_DEMO_TOKEN` | `undox-demo-public` |

If the name `undox-demo` is taken globally, rename in `render.yaml` and redeploy.

**Optional keep-warm (free):** [UptimeRobot](https://uptimerobot.com) HTTP monitor on `/healthz` every 10 minutes.

## Submission form fields

| Field | Value |
|---|---|
| Repo | https://github.com/manasdutta04/undox |
| Live demo | https://undox.vercel.app/app?session=demo-test-2 |
| MCP | https://undox-demo.onrender.com/mcp + Bearer `undox-demo-public` (public demo; see Connect page) |
| Video | ~3 min: TrueForge Allow + dashboard + kill/resume |
| Write-up | README + docs/FIELD_REPORT.md |
