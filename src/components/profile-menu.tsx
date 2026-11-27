"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const PLACEHOLDER_USER = {
  name: "Head of Sales",
  email: "Authentication coming soon",
  workspace: "Leilo Sales HQ",
};

type MenuRow = {
  id: string;
  label: string;
  hint?: string;
  href?: string;
  onSelect?: () => void;
  soon?: boolean;
};

const MENU_ROWS: MenuRow[] = [
  { id: "account", label: "Account settings", hint: "Profile and preferences", soon: true },
  { id: "notifications", label: "Notifications", hint: "Email and in-app alerts", soon: true },
  { id: "help", label: "Help & documentation", href: "/reference/business-structure" },
  { id: "sign-in", label: "Sign in", hint: "Connect your Leilo identity", soon: true },
  { id: "sign-out", label: "Sign out", soon: true },
];

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const onPointer = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || !rootRef.current?.contains(target)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Open profile menu"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-9 w-9 items-center justify-center rounded-full border text-paper/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime ${
          open
            ? "border-lime/50 bg-white/15 text-paper"
            : "border-white/20 bg-white/5 hover:bg-white/10 hover:text-paper"
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" />
        </svg>
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Profile"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(100vw-2rem,18.5rem)] overflow-hidden rounded-[12px] border border-white/15 bg-slate-deep text-paper shadow-[0_24px_48px_rgba(0,0,0,0.35)]"
        >
          <div className="border-b border-white/10 px-4 py-4">
            <ProfileIdentity />
            <p className="mt-3 text-xs text-paper/60">
              Placeholder profile until sign-in is wired. Actions below are not active yet.
            </p>
          </div>

          <ul className="py-2">
            {MENU_ROWS.map((row) => (
              <li key={row.id}>
                <ProfileMenuItem row={row} onNavigate={close} />
              </li>
            ))}
          </ul>

          <section className="border-t border-white/10 px-4 py-3">
            <p className="text-[0.65rem] uppercase tracking-[0.14em] text-paper/45">Workspace</p>
            <p className="mt-1 text-sm font-medium text-paper/90">{PLACEHOLDER_USER.workspace}</p>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function ProfileIdentity() {
  return <UserIdentity name={PLACEHOLDER_USER.name} email={PLACEHOLDER_USER.email} />;
}

function UserIdentity({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-paper"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current text-paper/85">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-tight text-paper">{name}</p>
        <p className="truncate text-sm text-paper/65">{email}</p>
      </div>
    </div>
  );
}

function ProfileMenuItem({ row, onNavigate }: { row: MenuRow; onNavigate: () => void }) {
  const content = (
    <>
      <span className="block font-medium">{row.label}</span>
      {row.hint ? <span className="mt-0.5 block text-xs text-paper/55">{row.hint}</span> : null}
    </>
  );

  const shellClass = `flex w-full items-start justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
    row.soon
      ? "cursor-default text-paper/50"
      : "text-paper/90 hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none"
  }`;

  const soonBadge = row.soon ? (
    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-paper/55">
      Soon
    </span>
  ) : null;

  if (row.href && !row.soon) {
    return (
      <Link href={row.href} role="menuitem" className={shellClass} onClick={onNavigate}>
        <span className="min-w-0">{content}</span>
      </Link>
    );
  }

  return (
    <button type="button" role="menuitem" disabled={row.soon} className={shellClass} onClick={row.onSelect}>
      <span className="min-w-0 flex-1">{content}</span>
      {soonBadge}
    </button>
  );
}