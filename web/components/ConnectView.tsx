"use client";

import { useState } from "react";
import Link from "next/link";
import {
  API_PUBLIC_URL,
  DEFAULT_SESSION,
  MCP_DEMO_TOKEN,
  MCP_URL,
  VERCEL_APP_URL,
  trueforgeMcpSnippet,
  withSession,
} from "@/lib/nav";

export function ConnectView() {
  const [copied, setCopied] = useState(false);
  const snippet = trueforgeMcpSnippet();
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="page-hero">
        <p className="eyebrow">TrueForge</p>
        <h1 className="page-title">Connect MCP</h1>
        <p className="page-lede">
          Paste this connector into TrueForge as-is. No Render dashboard, no token hunting — the demo Bearer
          is public by design (mock submits only).
        </p>
      </div>

      <div className="court-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>1 · Copy MCP config</h3>
        <p className="empty" style={{ marginBottom: 12, color: "var(--text)" }}>
          TrueForge → Settings → Connectors → add <code>undox-tools</code> with this JSON:
        </p>
        <pre className="code-panel" style={{ marginTop: 0 }}>
          {snippet}
        </pre>
        <div className="card-actions">
          <button type="button" className="btn" onClick={copy}>
            {copied ? "Copied" : "Copy MCP config"}
          </button>
        </div>
        <dl className="kv" style={{ marginTop: 16 }}>
          <dt>MCP URL</dt>
          <dd>{MCP_URL}</dd>
          <dt>Demo Bearer</dt>
          <dd>{MCP_DEMO_TOKEN}</dd>
          <dt>API / fixtures</dt>
          <dd>{API_PUBLIC_URL}</dd>
        </dl>
      </div>

      <div className="court-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>2 · Verify</h3>
        <ol className="checklist">
          <li>
            Call <code>get_exposure_dashboard</code> with session <code>{DEFAULT_SESSION}</code> — expect risk
            high and three submitted brokers.
          </li>
          <li>
            Open{" "}
            <Link href={exposureHref} style={{ textDecoration: "underline" }}>
              Exposure
            </Link>{" "}
            for the same session — statuses must match tool JSON.
          </li>
          <li>
            Optional fresh run: <code>find_*</code> → <code>run_sandbox_prepare</code> → Allow on literal PII →{" "}
            <code>submit_opt_out</code> (mode=mock).
          </li>
        </ol>
        <div className="card-actions">
          <Link className="btn btn-outline" href={exposureHref}>
            Open Exposure
          </Link>
          <a className="btn btn-outline" href={VERCEL_APP_URL} target="_blank" rel="noopener noreferrer">
            Live site
          </a>
        </div>
      </div>

      <details className="court-card">
        <summary style={{ cursor: "pointer", fontWeight: 800, textTransform: "uppercase", fontSize: 14 }}>
          Local clone (developers)
        </summary>
        <pre className="code-panel" style={{ marginTop: 12, boxShadow: "none" }}>
{`# API + fixtures + MCP
UNDOX_MCP_TOKEN=dev-secret UNDOX_MCP_DEMO_TOKEN=undox-demo-public npm run serve:public

# UI (rewrites /backend → local API)
cd web
UNDOX_API_URL=http://127.0.0.1:8080 npm run dev`}
        </pre>
      </details>
    </>
  );
}
