"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navItems } from "@/lib/nav";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-full bg-foam text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime focus:px-3 focus:py-2 focus:text-lagoon-deep"
      >
        Skip to content
      </a>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-lagoon-deep/40 md:hidden"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-lagoon text-paper transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <p className="font-display text-2xl tracking-tight">Leilo</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-lime">
            Sales HQ
          </p>
          <p className="mt-3 text-sm text-paper/70">Internal · Head of Sales</p>
        </div>

        <nav id="primary-nav" className="flex flex-1 flex-col gap-1 p-3" aria-label="Primary">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-[10px] px-3 py-2.5 transition-colors ${
                  active
                    ? "bg-white/10 text-lime"
                    : "text-paper/80 hover:bg-white/5 hover:text-paper"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="block text-xs font-semibold uppercase tracking-[0.08em]">
                  {item.label}
                </span>
                <span className="block text-xs text-paper/50">{item.hint}</span>
              </Link>
            );
          })}
        </nav>

        <p className="px-5 pb-5 text-xs text-paper/45">
          Sample cards stay labeled until a source has data.
        </p>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md border border-line px-2.5 py-1.5 text-sm md:hidden"
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="primary-nav"
            >
              Menu
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-muted">
                Lay low. Let loose.
              </p>
              <p className="text-sm text-ink">November 2026 · MTD view</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden rounded-full bg-lime/70 px-3 py-1 text-lagoon-deep sm:inline">
              Mock data
            </span>
            <span className="text-muted">Head of Sales</span>
          </div>
        </header>

        <main id="main" className="px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
