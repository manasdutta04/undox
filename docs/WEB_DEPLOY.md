# Full-stack deploy (Vercel UI + Render API/MCP)

Undox splits hosts on purpose:

| Layer | Host | Role |
|---|---|---|
| Product UI | **Vercel** (`web/`) | Landing + `/app/*` — light theme, same-origin `/backend` proxy |
| API · fixtures · MCP | **Render** (`scripts/serve-public.ts`) | Session store, broker HTML, HTTP MCP for TrueForge |

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

5. Deploy → open `https://<project>.vercel.app/app?session=demo-test-2`.
6. Connect MCP instructions: `/app/connect`.

Browser traffic for sessions and fixtures goes through **Vercel** (`/backend/api`, `/backend/fixtures`). MCP stays on Render’s `/mcp` (TrueForge connects there directly).

### Local UI

```bash
# Terminal 1 — API + fixtures + MCP
UNDOX_MCP_TOKEN=dev-secret npm run serve:public

# Terminal 2 — Next (rewrites → Render or local)
cd web && npm install && npm run dev
# Point rewrites at local API:
# UNDOX_API_URL=http://127.0.0.1:8080 npm run dev
```

To bypass rewrites and call the API origin from the browser:

```bash
NEXT_PUBLIC_UNDOX_USE_DIRECT_API=1 NEXT_PUBLIC_UNDOX_API_URL=http://127.0.0.1:8080 npm run dev
```

## 2. Render (API + MCP)

Blueprint: [`render.yaml`](../render.yaml). After Vercel is live:

| Name | Value |
|---|---|
| `UNDOX_WEB_URL` | `https://undox-demo.vercel.app` |
| `UNDOX_CORS_ORIGINS` | `https://undox-demo.vercel.app,http://localhost:3000,http://127.0.0.1:3000` |
| `UNDOX_MCP_TOKEN` | (generated — share privately for TrueForge tests) |

Verify:

- `GET https://undox-demo.onrender.com/healthz`
- `GET https://undox-demo.onrender.com/` → redirects to Vercel
- MCP: `https://undox-demo.onrender.com/mcp` with `Authorization: Bearer <token>`

See [`deploy/RENDER_DEPLOY.md`](../deploy/RENDER_DEPLOY.md).

## 3. TrueForge → live MCP

In the app open **Connect** (`/app/connect`) and paste the connector JSON into TrueForge, replacing `YOUR_UNDOX_MCP_TOKEN` with the Render env value.

Smoke test:

1. `get_exposure_dashboard` · session `demo-test-2`
2. Match statuses on Vercel Exposure page
3. Optional: fresh `find_*` → prepare → Allow → `submit_opt_out` (mock)
