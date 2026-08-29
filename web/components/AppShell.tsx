"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { APP_NAV, GITHUB_REPO, withSession } from "@/lib/nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const session = params.get("session");

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link href="/" className="logo" aria-label="Undox home">
          U
        </Link>
        <nav className="nav-pill" aria-label="App">
          {APP_NAV.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={withSession(item.href, session)}
                className={`nav-link${active ? " active" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <a className="sign-in" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </header>
      {children}
      <footer className="app-footer">
        <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">
          Undox · GitHub
        </a>
      </footer>
    </div>
  );
}
