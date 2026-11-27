"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { PlatformTitle } from "@/components/platform-title";
import { primaryNav, workspaceNav } from "@/lib/nav";

const STORAGE_KEY = "leilo-sidebar-collapsed";
const EXPANDED_WIDTH = "13.5rem";
const COLLAPSED_WIDTH = "4.25rem";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarToggle({
  collapsed,
  onToggle,
  className = "",
  label = "Toggle sidebar",
  tone = "dark",
}: {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  label?: string;
  tone?: "dark" | "light";
}) {
  const toneClass =
    tone === "light"
      ? "text-muted hover:bg-sand hover:text-heading focus-visible:outline-sky"
      : "text-paper/80 hover:bg-white/10 hover:text-paper focus-visible:outline-lime";

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${toneClass} ${className}`}
    >
      <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[18px] w-[18px]">
        <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <path d="M7.5 4v12" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </button>
  );
}

function NavLink({
  href,
  label,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const shared = active
    ? "bg-white/10 text-lime"
    : "text-paper/85 hover:bg-white/5 hover:text-paper";

  if (collapsed) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        title={label}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`flex h-10 w-10 items-center justify-center rounded-[10px] font-display text-lg leading-none transition-colors ${shared}`}
      >
        <span aria-hidden="true">–</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block rounded-[10px] px-3 py-2.5 text-xs font-semibold uppercase leading-snug tracking-[0.06em] transition-colors ${shared}`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [ready, setReady] = useState(false);
  const workspaceActive = workspaceNav.some((item) => isActive(pathname, item.href));
  const [workspaceOpen, setWorkspaceOpen] = useState(workspaceActive);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const desktopCollapsed = ready && collapsed;
  const sidebarWidth = desktopCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  return (
    <div
      className="min-h-full bg-foam text-ink"
      suppressHydrationWarning
      style={{ "--sidebar-width": sidebarWidth } as React.CSSProperties}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-lime focus:px-3 focus:py-2 focus:text-lagoon-deep"
      >
        Skip to content
      </a>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-lagoon-deep/40 md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`ark-chrome-nav bg-slate-deep fixed inset-y-0 left-0 z-40 flex w-[var(--sidebar-width)] flex-col overflow-hidden text-paper transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
        data-collapsed={desktopCollapsed ? "true" : "false"}
        suppressHydrationWarning
      >
        <div
          className={`shrink-0 border-b border-white/10 transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            desktopCollapsed ? "px-2 py-4" : "px-5 py-5"
          }`}
        >
          {desktopCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <p className="font-display text-xl tracking-tight" title="Leilo Sales HQ">
                L
              </p>
              <SidebarToggle collapsed={desktopCollapsed} onToggle={toggleCollapsed} className="hidden md:flex" />
            </div>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-2xl tracking-tight">Leilo</p>
                <SidebarToggle collapsed={desktopCollapsed} onToggle={toggleCollapsed} className="hidden md:flex" />
              </div>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-lime">Sales HQ</p>
              <p className="mt-2 text-sm text-paper/70">Head of Sales</p>
            </div>
          )}
        </div>

        <nav
          id="primary-nav"
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            desktopCollapsed ? "flex flex-col items-center gap-1 px-2 py-3" : "p-3"
          }`}
          aria-label="Primary"
        >
          <div className={desktopCollapsed ? "flex flex-col items-center gap-1" : "flex flex-col gap-1"}>
            {primaryNav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={isActive(pathname, item.href)}
                collapsed={desktopCollapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>

          {desktopCollapsed ? (
            <>
              <div className="my-2 h-px w-8 bg-white/25" role="separator" />
              <div className="flex flex-col items-center gap-1">
                {workspaceNav.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    active={isActive(pathname, item.href)}
                    collapsed
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="mx-2 my-3 h-px bg-white/25" role="separator" />

              <div>
                <button
                  type="button"
                  className={`flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.08em] transition-colors ${
                    workspaceActive ? "text-lime" : "text-paper/70 hover:bg-white/5 hover:text-paper"
                  }`}
                  aria-expanded={workspaceOpen}
                  aria-controls="workspace-nav"
                  onClick={() => setWorkspaceOpen((current) => !current)}
                >
                  Admin
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out ${
                      workspaceOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M5 8l5 5 5-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <div
                  id="workspace-nav"
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    workspaceOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex flex-col gap-1 pt-1 pl-2">
                      {workspaceNav.map((item) => (
                        <NavLink
                          key={item.href}
                          href={item.href}
                          label={item.label}
                          active={isActive(pathname, item.href)}
                          collapsed={false}
                          onNavigate={() => setMobileOpen(false)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </nav>
      </aside>

      <div className="transition-[padding] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:pl-[var(--sidebar-width)]">
        <header className="ark-platform-header bg-slate-deep sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 px-4 text-paper md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-[10px] border border-white/20 px-2.5 py-1.5 text-sm text-paper/90 transition-colors hover:bg-white/10 hover:text-paper md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-expanded={mobileOpen}
              aria-controls="primary-nav"
            >
              Menu
            </button>
            <Suspense fallback={<span className="inline-block h-7 w-36 animate-pulse rounded-md bg-white/10" />}>
              <PlatformTitle onDark />
            </Suspense>
          </div>
          <div className="flex items-center">
            <button
              type="button"
              aria-label="Account"
              title="Profile sign-in coming soon"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-paper/80 transition-colors hover:bg-white/10 hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" />
              </svg>
            </button>
          </div>
        </header>

        <main id="main" className="px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}