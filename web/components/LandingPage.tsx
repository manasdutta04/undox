import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { DEFAULT_SESSION, GITHUB_REPO, withSession } from "@/lib/nav";

export function LandingPage() {
  const appHref = withSession("/app", DEFAULT_SESSION);
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);

  return (
    <div className="dot-grid min-h-screen">
      <header className="landing-nav">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-mono text-sm font-semibold tracking-widest">UNDOX</span>
          <div className="flex items-center gap-4">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-black/60 hover:text-black"
            >
              GitHub
            </a>
            <Link href={appHref} className="landing-btn text-xs">
              Open app
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-section pt-20 md:pt-28">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/45">Data broker opt-outs</p>
        <h1 className="landing-h1 mt-4">
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
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={appHref} className="landing-btn">
            Open app <ArrowRight size={16} />
          </Link>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="landing-btn-outline">
            <Github size={16} /> Repository
          </a>
        </div>
      </section>

      <section className="landing-section border-t-2 border-black/10 bg-white/40">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/45">Problem</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Brokers republish your PII</h2>
        <p className="mt-4 max-w-2xl text-black/65 leading-relaxed">
          People-search sites aggregate names, addresses, phones, and dates of birth. Removal is tedious,
          error-prone, and often irreversible once you hit Submit. You need a system that finds listings,
          prepares forms carefully, and never submits without explicit human consent on the exact payload.
        </p>
      </section>

      <section className="landing-section border-t-2 border-black/10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/45">Product</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">Find → prepare → approve → submit</h2>
        <div className="feature-grid mt-10">
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
        <p className="mt-10">
          <Link href={exposureHref} className="landing-btn-outline text-xs">
            View demo session <ArrowRight size={14} />
          </Link>
        </p>
      </section>

      <section className="landing-section border-t-2 border-black/10 bg-white/40">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-black/45">TrueForge harness</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-3xl">MCP tools + sandbox + approval gate</h2>
        <p className="mt-4 max-w-2xl text-black/65 leading-relaxed">
          Custom HTTP MCP (<code className="font-mono text-sm">undox-tools</code>): find listings, run sandbox
          prepare scripts, gate <code className="font-mono text-sm">submit_opt_out</code> on human Allow, and
          expose session state to the Exposure Dashboard.
        </p>
        <pre className="mt-8 overflow-x-auto border-2 border-black bg-white p-4 font-mono text-xs leading-relaxed">
{`find_*  →  run_sandbox_prepare  →  [Human Allow]  →  submit_opt_out (mock)
                              ↘
                    get_exposure_dashboard / get_session_state`}
        </pre>
      </section>

      <footer className="border-t-2 border-black/10 px-6 py-8 text-center text-sm text-black/50">
        <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="hover:text-black">
          Undox · GitHub
        </a>
      </footer>
    </div>
  );
}
