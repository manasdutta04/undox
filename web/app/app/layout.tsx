import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Undox App",
  description: "Exposure dashboard and broker opt-out workspace.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="app-frame"><p className="app-main empty">Loading…</p></div>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
