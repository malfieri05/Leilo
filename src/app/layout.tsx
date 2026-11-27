import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { Suspense } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Leilo Sales HQ",
    template: "%s · Leilo Sales HQ",
  },
  description: "Internal sales dashboard for the Head of Sales at Leilo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <DashboardShell>
          <Suspense fallback={<p className="px-6 py-10 text-sm text-muted">Loading…</p>}>{children}</Suspense>
        </DashboardShell>
      </body>
    </html>
  );
}
