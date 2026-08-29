import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEFAULT_SESSION, withSession } from "@/lib/nav";
import { DecorMotif } from "@/components/DecorBloom";

export default function AppOverviewPage() {
  const exposureHref = withSession("/app/exposure", DEFAULT_SESSION);
  const connectHref = withSession("/app/connect", DEFAULT_SESSION);

  return (
    <>
      <div className="page-hero page-hero-decor">
        <DecorMotif className="motif-float motif-float-tr" kind="star" variant="yellow" size={40} />
        <DecorMotif className="motif-float motif-float-br" kind="leaf" variant="green" size={36} />
        <p className="eyebrow">Workspace</p>
        <h1 className="page-title">Exposure dashboard</h1>
        <p className="page-lede">
          Session-backed broker statuses and approval payloads — the same store Undox MCP reads via{" "}
          <code>get_exposure_dashboard</code>. Use the nav above to move between sections.
        </p>
      </div>

      <div className="panel panel-session">
        <DecorMotif className="bloom-corner bloom-tl" kind="bloom" variant="yellow" size={56} />
        <DecorMotif className="bloom-corner bloom-br" kind="spark" variant="green" size={44} />
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          Seeded session
        </p>
        <p className="session-id">
          <code>{DEFAULT_SESSION}</code>
        </p>
        <p className="page-lede" style={{ marginTop: 12, maxWidth: 480 }}>
          Fixture identity only. Dashboard and MCP share one session store — chat is not authoritative.
        </p>
        <div className="cta-row" style={{ marginTop: 24 }}>
          <Link href={exposureHref} className="btn">
            Open Exposure <ArrowRight size={16} />
          </Link>
          <Link href={connectHref} className="btn btn-outline">
            Connect MCP
          </Link>
        </div>
      </div>
    </>
  );
}
