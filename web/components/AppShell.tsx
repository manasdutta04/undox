"use client";

import { useSearchParams } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const session = params.get("session");

  return (
    <div className="app-frame">
      <SiteHeader variant="app" session={session} />
      <main className="app-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
