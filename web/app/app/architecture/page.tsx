import Link from "next/link";
import { DEFAULT_SESSION, GITHUB_REPO, withSession } from "@/lib/nav";

export default function ArchitecturePage() {
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);

  return (
    <>
      <div className="page-hero">
        <p className="eyebrow">TrueForge</p>
        <h1 className="page-title">Architecture</h1>
        <p className="page-lede">How Undox uses TrueForge primitives — MCP tools, sandbox, and approval gate.</p>
      </div>

      <div className="court-card">
        <h3>MCP flow (undox-tools)</h3>
        <ol style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.8, fontSize: 14 }}>
          <li>
            <code>find_*</code> — discover broker listings (fixtures on stage)
          </li>
          <li>
            <code>run_sandbox_prepare</code> — sandbox scripts build opt-out form fields
          </li>
          <li>
            <strong>Human Allow</strong> on literal PII → <code>submit_opt_out</code> (mock)
          </li>
          <li>
            <code>get_session_state</code> / <code>get_exposure_dashboard</code> — same store as this app
          </li>
        </ol>
      </div>

      <table className="harness-table">
        <thead>
          <tr>
            <th>Primitive</th>
            <th>Undox wiring</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>MCP tools</td>
            <td>Custom HTTP MCP: find → prepare → approval-gated submit</td>
          </tr>
          <tr>
            <td>Sandbox + skills</td>
            <td>spokeo, peoplefind, clearbook, exposure-score skills</td>
          </tr>
          <tr>
            <td>Approval</td>
            <td>
              <code>submit_opt_out</code> requires Allow on exact PII
            </td>
          </tr>
          <tr>
            <td>Subagents</td>
            <td>
              <code>dynamicSubAgents</code> + parallel tool fan-out fallback
            </td>
          </tr>
          <tr>
            <td>Sessions</td>
            <td>File store keyed by <code>session_id</code> — survives TrueForge restart</td>
          </tr>
          <tr>
            <td>Status UI</td>
            <td>This app + optional OpenUI; chat is not authoritative</td>
          </tr>
        </tbody>
      </table>

      <div className="card-actions" style={{ marginTop: 24 }}>
        <Link className="btn" href={exposureHref}>
          Open demo session
        </Link>
        <a className="btn btn-outline" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
          Repository
        </a>
      </div>
    </>
  );
}
