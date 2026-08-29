import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "../interior.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Undox App",
  description: "Exposure dashboard and broker opt-out workspace.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`app-root ${inter.variable} ${jetbrainsMono.variable}`}>
      <Suspense fallback={<div className="app-shell"><p className="empty">Loading…</p></div>}>
        <AppShell>{children}</AppShell>
      </Suspense>
    </div>
  );
}
