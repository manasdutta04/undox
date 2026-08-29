"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEFAULT_SESSION, GITHUB_REPO, withSession } from "@/lib/nav";

const LANDING_LINKS = [
  { href: "/app", label: "Product" },
  { href: "/app/exposure", label: "Demo" },
  { href: "/app/connect", label: "Connect" },
] as const;

export function SiteHeader({
  session,
  variant = "marketing",
}: {
  session?: string | null;
  variant?: "marketing" | "app";
}) {
  const pathname = usePathname();
  const sid = session ?? DEFAULT_SESSION;
  const appHref = withSession("/app", sid);
  const connectHref = withSession("/app/connect", sid);

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link href="/" className="brand" aria-label="Undox home">
          <span className="brand-mark">U</span>
          <span className="brand-word">Undox</span>
        </Link>

        {variant === "marketing" ? (
          <nav className="site-nav-links" aria-label="Primary">
            {LANDING_LINKS.map((item) => {
              const href = withSession(item.href, sid);
              const active =
                item.href === "/app"
                  ? pathname === "/app" || pathname.startsWith("/app/")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`site-nav-item${active && pathname !== "/" ? " active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="nav-actions">
          <a href={GITHUB_REPO} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            GitHub
          </a>
          {variant === "marketing" ? (
            <Link href={appHref} className="btn">
              Open app
            </Link>
          ) : (
            <Link href={connectHref} className="btn">
              Connect MCP
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
