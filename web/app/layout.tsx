import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Undox — Data broker opt-outs with human approval",
  description:
    "TrueForge agent that finds broker listings, prepares opt-outs, and pauses for human approval before submit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${ibmPlexMono.variable}`}>
      <body className="undox">{children}</body>
    </html>
  );
}
