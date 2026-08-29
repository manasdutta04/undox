import Link from "next/link";
import { DEFAULT_SESSION } from "@/lib/nav";

export default function AppOverviewPage() {
  const q = `?session=${encodeURIComponent(DEFAULT_SESSION)}`;

  return (
    <>
      <div className="page-hero">
        <p className="eyebrow">Workspace</p>
        <h1 className="page-title">Exposure dashboard</h1>
        <p className="page-lede">
          Session-backed broker statuses, fixture listings, and approval payloads — the same store Undox MCP
          reads via <code>get_exposure_dashboard</code>.
        </p>
      </div>

      <div className="route-cards">
        <Link className="route-card" href={`/app/exposure${q}`}>
          <strong>Exposure</strong>
          <span>Risk score, broker cards, milestones, and event log for the active session.</span>
        </Link>
        <Link className="route-card" href={`/app/brokers${q}`}>
          <strong>Brokers</strong>
          <span>Per-broker pipeline, fixture listing links, and opt-out form URLs.</span>
        </Link>
        <Link className="route-card" href={`/app/approval${q}`}>
          <strong>Approval</strong>
          <span>Read-only mirror of literal PII and form fields before Allow on submit.</span>
        </Link>
      </div>

      <div className="route-cards" style={{ marginTop: 14, gridTemplateColumns: "1fr 1fr" }}>
        <Link className="route-card" href={`/app/architecture${q}`}>
          <strong>Architecture</strong>
          <span>TrueForge primitives — MCP flow, sandbox skills, approval gate.</span>
        </Link>
        <Link className="route-card" href={`/app/connect${q}`}>
          <strong>Connect MCP</strong>
          <span>Wire TrueForge to the live undox-tools MCP and smoke-test the harness.</span>
        </Link>
      </div>
    </>
  );
}
