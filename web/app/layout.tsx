import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./landing.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Undox — Data broker opt-outs with human approval",
  description:
    "TrueForge agent that finds broker listings, prepares opt-outs, and pauses for human approval before submit.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="is-landing">{children}</body>
    </html>
  );
}
