"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { APP_NAV, GITHUB_REPO, withSession } from "@/lib/nav";
import { SiteFooter } from "./SiteFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const session = params.get("session");

  return (
    <div className="app-frame">
      <header className="site-nav">
        <div className="site-nav-inner">
          <Link href="/" className="brand" aria-label="Undox home">
            <span className="brand-mark">U</span>
            <span className="brand-word">Undox</span>
          </Link>

          <nav className="app-nav" aria-label="App">
            {APP_NAV.map((item) => {
              const active =
                item.href === "/app"
                  ? pathname === "/app"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={withSession(item.href, session)}
                  className={`app-nav-link${active ? " active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="nav-actions">
            <a className="btn btn-ghost" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link className="btn" href={withSession("/app/connect", session)}>
              Connect
            </Link>
          </div>
        </div>
      </header>

      <main className="app-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
