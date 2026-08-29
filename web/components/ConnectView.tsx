"use client";

import { useState } from "react";
import { API_PUBLIC_URL, MCP_URL, trueforgeMcpSnippet } from "@/lib/nav";

export function ConnectView() {
  const [copied, setCopied] = useState(false);
  const snippet = trueforgeMcpSnippet();

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
          Point TrueForge at the live Undox MCP so you can run find → prepare → approve → submit against the
          same session store this app reads.
        </p>
      </div>

      <div className="court-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Live endpoints</h3>
        <dl className="kv">
          <dt>MCP</dt>
          <dd>{MCP_URL}</dd>
          <dt>API / fixtures / health</dt>
          <dd>{API_PUBLIC_URL}</dd>
          <dt>Auth</dt>
          <dd>Authorization: Bearer &lt;UNDOX_MCP_TOKEN&gt;</dd>
        </dl>
      </div>

      <div className="court-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>1 · Get a token</h3>
        <p className="empty" style={{ marginBottom: 12, color: "var(--text)" }}>
          On Render → undox-demo → Environment, copy <code>UNDOX_MCP_TOKEN</code>. Do not commit it. For local
          runs use any secret with <code>UNDOX_MCP_TOKEN=… npm run serve:public</code>.
        </p>
      </div>

      <div className="court-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>2 · Add MCP connector in TrueForge</h3>
        <p className="empty" style={{ marginBottom: 12, color: "var(--text)" }}>
          Create connector <code>undox-tools</code> (or <code>undox-tool</code>) with header auth. Replace the
          placeholder token:
        </p>
        <pre className="code-panel" style={{ marginTop: 0, boxShadow: "none" }}>
          {snippet}
        </pre>
        <div className="card-actions">
          <button type="button" className="btn" onClick={copy}>
            {copied ? "Copied" : "Copy JSON"}
          </button>
        </div>
      </div>

      <div className="court-card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>3 · Smoke-test tools</h3>
        <ol style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.7, fontSize: 14, color: "var(--text)" }}>
          <li>
            Call <code>get_exposure_dashboard</code> with session <code>demo-test-2</code> — expect risk high +
            three submitted brokers.
          </li>
          <li>
            Open this app&apos;s Exposure page for the same session — statuses must match tool JSON.
          </li>
          <li>
            For a fresh run: <code>find_*</code> → <code>run_sandbox_prepare</code> → Allow on literal PII →{" "}
            <code>submit_opt_out</code> (mode=mock).
          </li>
        </ol>
      </div>

      <div className="court-card">
        <h3 style={{ marginTop: 0 }}>Local alternative</h3>
        <pre className="code-panel" style={{ marginTop: 0, boxShadow: "none" }}>
{`# API + fixtures + MCP
UNDOX_MCP_TOKEN=dev-secret npm run serve:public

# UI
cd web && npm run dev
# optional: NEXT_PUBLIC_UNDOX_USE_DIRECT_API=1 NEXT_PUBLIC_UNDOX_API_URL=http://127.0.0.1:8080`}
        </pre>
      </div>
    </>
  );
}
