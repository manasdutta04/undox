# Vercel deploy (Next.js UI)

The product UI lives in [`web/`](../web/). The API, fixtures, and MCP stay on Render.

## Vercel (UI)

1. Import repo at [vercel.com](https://vercel.com) → **Add New Project**.
2. Set **Root Directory** to `web`.
3. Framework preset: **Next.js** (auto-detected).
4. Environment variable:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_UNDOX_API_URL` | `https://undox-demo.onrender.com` |

5. Deploy. Production URL (example): `https://undox-demo.vercel.app`
6. Open app: `https://undox-demo.vercel.app/app?session=demo-test-2`

### Local dev

```bash
# Terminal 1 — API + fixtures (from repo root)
UNDOX_MCP_TOKEN=dev-secret npm run serve:public

# Terminal 2 — Next UI
cd web
npm install
NEXT_PUBLIC_UNDOX_API_URL=http://127.0.0.1:8080 npm run dev
```

Visit `http://localhost:3000` (landing) and `http://localhost:3000/app/exposure?session=demo-test-2`.

## Render (API)

After Vercel is live, set CORS on the Render service so the browser can call `/api/*`:

| Name | Value |
|---|---|
| `UNDOX_WEB_URL` | `https://undox-demo.vercel.app` |
| `UNDOX_CORS_ORIGINS` | `https://undox-demo.vercel.app,http://localhost:3000,http://127.0.0.1:3000` |

Redeploy Render. Verify:

- `GET https://undox-demo.onrender.com/healthz`
- `GET https://undox-demo.onrender.com/` → redirects to Vercel app
- Fixtures unchanged: `/fixtures/spokeo/`, `/fixtures/peoplefind/`, `/fixtures/clearbook/`

See also [`deploy/RENDER_DEPLOY.md`](../deploy/RENDER_DEPLOY.md).
