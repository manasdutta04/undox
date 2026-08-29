import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { DEFAULT_SESSION, GITHUB_REPO, withSession } from "@/lib/nav";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { DecorMotif } from "./DecorBloom";

export function LandingPage() {
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);
  const brokersHref = withSession("/app/brokers", DEFAULT_SESSION);
  const approvalHref = withSession("/app/approval", DEFAULT_SESSION);
  const connectHref = withSession("/app/connect", DEFAULT_SESSION);

  return (
    <div className="page-frame">
      <SiteHeader variant="marketing" />

      <section className="landing-section landing-hero">
        <div className="panel">
          <DecorMotif className="bloom-hero-tr" kind="bloom" variant="yellow" size={64} />
          <DecorMotif className="bloom-hero-br" kind="star" variant="green" size={40} />
          <DecorMotif className="motif-hero-ml" kind="spark" variant="yellow" size={32} />
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
          <div className="cta-row">
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
        </div>
      </section>

      <div className="band-hatch" aria-hidden="true" />

      <div className="motif-scatter" aria-hidden="true">
        <DecorMotif kind="leaf" variant="green" size={36} />
        <DecorMotif kind="bloom" variant="yellow" size={44} />
        <DecorMotif kind="spark" variant="green" size={28} />
        <DecorMotif kind="star" variant="yellow" size={34} />
        <DecorMotif kind="bloom" variant="green" size={30} />
      </div>

      <section className="landing-section landing-section-decor">
        <DecorMotif className="motif-float motif-float-tr" kind="leaf" variant="green" size={48} />
        <p className="eyebrow">Problem</p>
        <h2 className="page-title page-title-md">Brokers republish your PII</h2>
        <div className="problem-grid">
          <p className="page-lede" style={{ marginTop: 0 }}>
            People-search sites aggregate names, addresses, phones, and dates of birth. Removal is tedious,
            error-prone, and often irreversible once you hit Submit. You need a system that finds listings,
            prepares forms carefully, and never submits without explicit human consent on the exact payload.
          </p>
          <ul className="leak-list">
            <li>
              <span className="dot" aria-hidden="true" /> Full name + aliases
            </li>
            <li>
              <span className="dot" aria-hidden="true" /> Home address
            </li>
            <li>
              <span className="dot" aria-hidden="true" /> Phone numbers
            </li>
            <li>
              <span className="dot" aria-hidden="true" /> Date of birth
            </li>
            <li>
              <span className="dot" aria-hidden="true" /> Relatives &amp; associates
            </li>
          </ul>
        </div>
      </section>

      <section className="landing-section landing-section-decor">
        <DecorMotif className="motif-float motif-float-tr" kind="star" variant="yellow" size={42} />
        <p className="eyebrow">Product</p>
        <h2 className="page-title page-title-md">Find → prepare → approve → submit</h2>
        <div className="feature-grid">
          <article className="feature-card feature-card-decor">
            <DecorMotif className="motif-card" kind="bloom" variant="yellow" size={28} />
            <div className="feature-num">01</div>
            <h3>Exposure</h3>
            <p>Risk score and broker statuses from the same session store as Undox MCP — not chat prose.</p>
            <p className="feature-card-action">
              <Link href={exposureHref} className="btn btn-outline btn-sm">
                Open
              </Link>
            </p>
          </article>
          <article className="feature-card feature-card-decor">
            <DecorMotif className="motif-card" kind="leaf" variant="green" size={28} />
            <div className="feature-num">02</div>
            <h3>Brokers</h3>
            <p>Fixture listings for PeopleFind, Clearbook, and Spokeo — reliable demos without live CAPTCHA.</p>
            <p className="feature-card-action">
              <Link href={brokersHref} className="btn btn-outline btn-sm">
                Open
              </Link>
            </p>
          </article>
          <article className="feature-card feature-card-decor">
            <DecorMotif className="motif-card" kind="spark" variant="yellow" size={28} />
            <div className="feature-num">03</div>
            <h3>Approval</h3>
            <p>Read-only preview of the exact PII and form fields shown before Allow on submit.</p>
            <p className="feature-card-action">
              <Link href={approvalHref} className="btn btn-outline btn-sm">
                Open
              </Link>
            </p>
          </article>
        </div>
      </section>

      <section className="landing-section">
        <p className="eyebrow">TrueForge harness</p>
        <h2 className="page-title page-title-md">MCP tools + sandbox + approval gate</h2>
        <p className="page-lede">
          Custom HTTP MCP (<code>undox-tools</code>): find listings, run sandbox prepare scripts, gate{" "}
          <code>submit_opt_out</code> on human Allow, and expose session state to this dashboard.
        </p>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div>
              <strong>find_*</strong>
              <p>Discover broker listings (fixtures on stage).</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div>
              <strong>run_sandbox_prepare</strong>
              <p>Sandbox scripts build opt-out form fields.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div>
              <strong>Human Allow</strong>
              <p>Gate submit on literal PII in TrueForge.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div>
              <strong>submit_opt_out</strong>
              <p>Mock submit + dashboard / session state tools.</p>
            </div>
          </div>
        </div>
        <pre className="code-panel">{`find_*  →  run_sandbox_prepare  →  [Human Allow]  →  submit_opt_out (mock)
                              ↘
                    get_exposure_dashboard / get_session_state`}</pre>
      </section>

      <section className="cta-band">
        <div className="cta-band-inner">
          <DecorMotif className="motif-cta-l" kind="bloom" variant="cream" size={52} />
          <DecorMotif className="motif-cta-r" kind="star" variant="cream" size={40} />
          <div>
            <h2>Ready to verify</h2>
            <p>Open the seeded demo session, then paste the MCP connector into TrueForge.</p>
          </div>
          <div className="cta-row" style={{ marginTop: 0 }}>
            <Link href={exposureHref} className="btn btn-outline">
              Open demo <ArrowRight size={16} />
            </Link>
            <Link href={connectHref} className="btn btn-outline">
              Copy MCP config
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
