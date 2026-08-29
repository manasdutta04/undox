import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { DEFAULT_SESSION, GITHUB_REPO, withSession } from "@/lib/nav";

export function LandingPage() {
  const appHref = withSession("/app", DEFAULT_SESSION);
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);
  const brokersHref = withSession("/app/brokers", DEFAULT_SESSION);
  const approvalHref = withSession("/app/approval", DEFAULT_SESSION);
  const connectHref = withSession("/app/connect", DEFAULT_SESSION);

  return (
    <div>
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">U</span>
            <span className="brand-word">Undox</span>
          </Link>
          <div className="nav-actions">
            <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              GitHub
            </a>
            <Link href={appHref} className="btn">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-section" style={{ paddingTop: 72 }}>
        <p className="eyebrow">Data broker opt-outs</p>
        <h1 className="landing-h1">
          Find exposure.
          <br />
          Prepare opt-outs.
          <br />
          Approve before submit.
        </h1>
        <p className="landing-lede">
          Undox is a TrueForge agent that discovers people-search listings, prepares opt-out payloads in a
          sandbox, and pauses for human approval on literal PII before any submission.
        </p>
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href={exposureHref} className="btn">
            Open demo <ArrowRight size={16} />
          </Link>
          <Link href={connectHref} className="btn btn-outline">
            Connect MCP
          </Link>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <Github size={16} /> Repository
          </a>
        </div>
        <div className="verify-strip">
          <span>1 · Exposure</span>
          <span className="sep">→</span>
          <span>2 · Brokers</span>
          <span className="sep">→</span>
          <span>3 · Approval</span>
          <span className="sep">→</span>
          <span>4 · Connect MCP</span>
        </div>
      </section>

      <section className="landing-section">
        <p className="eyebrow">Problem</p>
        <h2 className="page-title" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
          Brokers republish your PII
        </h2>
        <p className="page-lede">
          People-search sites aggregate names, addresses, phones, and dates of birth. Removal is tedious,
          error-prone, and often irreversible once you hit Submit. You need a system that finds listings,
          prepares forms carefully, and never submits without explicit human consent on the exact payload.
        </p>
      </section>

      <section className="landing-section">
        <p className="eyebrow">Product</p>
        <h2 className="page-title" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
          Find → prepare → approve → submit
        </h2>
        <div className="feature-grid">
          <article className="feature-card">
            <h3>1 · Exposure</h3>
            <p>Risk score and broker statuses from the same session store as Undox MCP — not chat prose.</p>
            <p style={{ marginTop: 12 }}>
              <Link href={exposureHref} className="btn btn-outline" style={{ height: 36, fontSize: 11 }}>
                Open
              </Link>
            </p>
          </article>
          <article className="feature-card">
            <h3>2 · Brokers</h3>
            <p>Fixture listings for PeopleFind, Clearbook, and Spokeo — reliable demos without live CAPTCHA.</p>
            <p style={{ marginTop: 12 }}>
              <Link href={brokersHref} className="btn btn-outline" style={{ height: 36, fontSize: 11 }}>
                Open
              </Link>
            </p>
          </article>
          <article className="feature-card">
            <h3>3 · Approval</h3>
            <p>Read-only preview of the exact PII and form fields shown before Allow on submit.</p>
            <p style={{ marginTop: 12 }}>
              <Link href={approvalHref} className="btn btn-outline" style={{ height: 36, fontSize: 11 }}>
                Open
              </Link>
            </p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <p className="eyebrow">TrueForge harness</p>
        <h2 className="page-title" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
          MCP tools + sandbox + approval gate
        </h2>
        <p className="page-lede">
          Custom HTTP MCP (<code>undox-tools</code>): find listings, run sandbox prepare scripts, gate{" "}
          <code>submit_opt_out</code> on human Allow, and expose session state to this dashboard. Paste-ready
          connector on Connect — no Render dashboard required.
        </p>
        <pre className="code-panel">{`find_*  →  run_sandbox_prepare  →  [Human Allow]  →  submit_opt_out (mock)
                              ↘
                    get_exposure_dashboard / get_session_state`}</pre>
        <p style={{ marginTop: 20 }}>
          <Link href={connectHref} className="btn">
            Copy MCP config <ArrowRight size={16} />
          </Link>
        </p>
      </section>

      <footer className="site-footer">
        <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
          Undox · GitHub
        </a>
      </footer>
    </div>
  );
}
