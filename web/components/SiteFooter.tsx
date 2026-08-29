import Link from "next/link";
import {
  API_PUBLIC_URL,
  DEFAULT_SESSION,
  GITHUB_REPO,
  MCP_URL,
  VERCEL_APP_URL,
  withSession,
} from "@/lib/nav";
import { DecorMotif } from "./DecorBloom";

export function SiteFooter() {
  const exposure = withSession("/app/exposure", DEFAULT_SESSION);
  const brokers = withSession("/app/brokers", DEFAULT_SESSION);
  const approval = withSession("/app/approval", DEFAULT_SESSION);
  const connect = withSession("/app/connect", DEFAULT_SESSION);
  const architecture = withSession("/app/architecture", DEFAULT_SESSION);

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <Link href="/" className="brand">
            <span className="brand-mark">U</span>
            <span className="brand-word">Undox</span>
            <DecorMotif className="bloom-inline" kind="bloom" variant="yellow" size={28} />
            <DecorMotif className="bloom-inline" kind="spark" variant="green" size={22} />
          </Link>
          <p>
            Approval-gated data-broker opt-outs on TrueForge. Dashboard and MCP share one session store —
            chat is not authoritative.
          </p>
        </div>

        <div>
          <h4>Product</h4>
          <ul>
            <li>
              <Link href={exposure}>Exposure</Link>
            </li>
            <li>
              <Link href={brokers}>Brokers</Link>
            </li>
            <li>
              <Link href={approval}>Approval</Link>
            </li>
            <li>
              <Link href={connect}>Connect MCP</Link>
            </li>
            <li>
              <Link href={architecture}>Architecture</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4>Resources</h4>
          <ul>
            <li>
              <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </li>
            <li>
              <a href={`${API_PUBLIC_URL}/healthz`} target="_blank" rel="noopener noreferrer">
                API health
              </a>
            </li>
            <li>
              <a href={MCP_URL} target="_blank" rel="noopener noreferrer">
                MCP endpoint
              </a>
            </li>
            <li>
              <a href={VERCEL_APP_URL} target="_blank" rel="noopener noreferrer">
                Live site
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="site-footer-bar-wrap">
        <div className="site-footer-bar">
          <span>Undox · mock submits · fixture identity only</span>
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
            manasdutta04/undox
          </a>
        </div>
      </div>
    </footer>
  );
}
