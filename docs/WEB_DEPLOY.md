# Full-stack deploy (Vercel UI + Render API/MCP)

| Layer | Host | Role |
|---|---|---|
| Product UI | **Vercel** (`web/`) | Landing + `/app/*`; `/backend/*` → Render |
| API · fixtures · MCP | **Render** (`scripts/serve-public.ts`) | Session store, broker HTML, HTTP MCP |

Canonical UI: **https://undox.vercel.app** · TrueForge + Ollama stay local.

## Checklist

### A · Vercel env

- [ ] Import repo → **Root Directory** = `web` · Framework Next.js
- [ ] `UNDOX_API_URL` = `https://undox-demo.onrender.com` (rewrites)
- [ ] `NEXT_PUBLIC_UNDOX_API_URL` = same (optional SSR fallback)
- [ ] Deploy → open https://undox.vercel.app/app?session=demo-test-2

### B · Render env

Blueprint: [`render.yaml`](../render.yaml)

| Name | Value |
|---|---|
| `UNDOX_WEB_URL` | `https://undox.vercel.app` |
| `UNDOX_CORS_ORIGINS` | `https://undox.vercel.app,http://localhost:3000,http://127.0.0.1:3000` |
| `UNDOX_MCP_DEMO_TOKEN` | `undox-demo-public` |
| `UNDOX_MCP_TOKEN` | optional private ops token |

See [`deploy/RENDER_DEPLOY.md`](../deploy/RENDER_DEPLOY.md).

### C · Smoke

- [ ] `GET https://undox-demo.onrender.com/healthz`
- [ ] UI: Exposure → Brokers → Approval → Connect (`demo-test-2`)
- [ ] **Connect JSON works as-is** — open https://undox.vercel.app/app/connect → Copy MCP config → paste into TrueForge (Bearer `undox-demo-public`, no edits)
- [ ] Optional: `get_exposure_dashboard` in TrueForge matches Vercel Exposure

## Local UI

```bash
# Terminal 1 — API + fixtures + MCP
UNDOX_MCP_TOKEN=dev-secret UNDOX_MCP_DEMO_TOKEN=undox-demo-public npm run serve:public

# Terminal 2 — Next
cd web && npm install
UNDOX_API_URL=http://127.0.0.1:8080 npm run dev
```
