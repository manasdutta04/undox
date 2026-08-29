# Full-stack deploy (Vercel UI + Render API/MCP)

Undox splits hosts on purpose:

| Layer | Host | Role |
|---|---|---|
| Product UI | **Vercel** (`web/`) | Landing + `/app/*` — neo-brutal theme, `/backend` proxy |
| API · fixtures · MCP | **Render** (`scripts/serve-public.ts`) | Session store, broker HTML, HTTP MCP for TrueForge |

Canonical UI: **https://undox.vercel.app**

TrueForge + Ollama stay local — they are not hosted on Vercel.

## 1. Vercel (UI)

1. Import repo at [vercel.com](https://vercel.com) → **Add New Project**.
2. Set **Root Directory** to `web`.
3. Framework: **Next.js**.
4. Environment:

   | Name | Value | Notes |
   |---|---|---|
   | `UNDOX_API_URL` | `https://undox-demo.onrender.com` | Used by Next rewrites (`/backend/*` → Render) |
   | `NEXT_PUBLIC_UNDOX_API_URL` | `https://undox-demo.onrender.com` | Optional fallback / SSR |

5. Deploy → open `https://undox.vercel.app/app?session=demo-test-2`.
6. Connect MCP: `/app/connect` (copy-paste JSON; public demo Bearer).

### Local UI

```bash
# Terminal 1 — API + fixtures + MCP
UNDOX_MCP_TOKEN=dev-secret UNDOX_MCP_DEMO_TOKEN=undox-demo-public npm run serve:public

# Terminal 2 — Next
cd web && npm install
UNDOX_API_URL=http://127.0.0.1:8080 npm run dev
```

## 2. Render (API + MCP)

Blueprint: [`render.yaml`](../render.yaml):

| Name | Value |
|---|---|
| `UNDOX_WEB_URL` | `https://undox.vercel.app` |
| `UNDOX_CORS_ORIGINS` | `https://undox.vercel.app,http://localhost:3000,http://127.0.0.1:3000` |
| `UNDOX_MCP_DEMO_TOKEN` | `undox-demo-public` |
| `UNDOX_MCP_TOKEN` | (optional private ops token) |

Verify:

- `GET https://undox-demo.onrender.com/healthz`
- `GET https://undox-demo.onrender.com/` → redirects to Vercel
- MCP: Bearer `undox-demo-public` (same as Connect page)

See [`deploy/RENDER_DEPLOY.md`](../deploy/RENDER_DEPLOY.md).

## 3. TrueForge → live MCP

Open **https://undox.vercel.app/app/connect** → **Copy MCP config** → paste into TrueForge. No token replacement needed.

Smoke test:

1. `get_exposure_dashboard` · session `demo-test-2`
2. Match statuses on Vercel Exposure page
3. Optional: fresh `find_*` → prepare → Allow → `submit_opt_out` (mock)
