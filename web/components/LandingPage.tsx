import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { DEFAULT_SESSION, GITHUB_REPO, withSession } from "@/lib/nav";

export function LandingPage() {
  const appHref = withSession("/app", DEFAULT_SESSION);
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);
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

      <section className="landing-section" style={{ paddingTop: 88 }}>
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
        <div style={{ marginTop: 36, display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Link href={appHref} className="btn">
            Open app <ArrowRight size={16} />
          </Link>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <Github size={16} /> Repository
          </a>
          <Link href={connectHref} className="btn btn-outline">
            Connect MCP
          </Link>
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
          </article>
          <article className="feature-card">
            <h3>2 · Brokers</h3>
            <p>Fixture listings for PeopleFind, Clearbook, and Spokeo — reliable demos without live CAPTCHA.</p>
          </article>
          <article className="feature-card">
            <h3>3 · Approval</h3>
            <p>Read-only preview of the exact PII and form fields shown before Allow on submit.</p>
          </article>
        </div>
        <p style={{ marginTop: 28 }}>
          <Link href={exposureHref} className="btn btn-outline">
            View demo session <ArrowRight size={14} />
          </Link>
        </p>
      </section>

      <section className="landing-section">
        <p className="eyebrow">TrueForge harness</p>
        <h2 className="page-title" style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>
          MCP tools + sandbox + approval gate
        </h2>
        <p className="page-lede">
          Custom HTTP MCP (<code>undox-tools</code>): find listings, run sandbox prepare scripts, gate{" "}
          <code>submit_opt_out</code> on human Allow, and expose session state to this dashboard.
        </p>
        <pre className="code-panel">{`find_*  →  run_sandbox_prepare  →  [Human Allow]  →  submit_opt_out (mock)
                              ↘
                    get_exposure_dashboard / get_session_state`}</pre>
      </section>

      <footer className="site-footer">
        <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
          Undox · GitHub
        </a>
      </footer>
    </div>
  );
}
