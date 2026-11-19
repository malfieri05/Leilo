"use client";

import { useActionState } from "react";
import { importFileAction, syncSourceAction } from "@/app/sources/actions";
import type { SyncState } from "@/lib/sources/types";

const buttonClass =
  "rounded-[10px] bg-lagoon px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-paper disabled:opacity-40";

export function SyncButton({ source, disabled }: { source: string; disabled: boolean }) {
  const [state, action, pending] = useActionState(syncSourceAction, null as SyncState);
  return (
    <form action={action} className="flex max-w-xs flex-col items-start gap-1">
      <input type="hidden" name="source" value={source} />
      <button type="submit" className={buttonClass} disabled={disabled || pending}>
        {pending ? "Syncing" : "Sync"}
      </button>
      {state ? <ActionNote state={state} /> : null}
    </form>
  );
}

export function SyncAllButton({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState(syncSourceAction, null as SyncState);
  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="source" value="all" />
      <button type="submit" className={buttonClass} disabled={disabled || pending}>
        {pending ? "Syncing" : "Sync configured sources"}
      </button>
      {state ? <ActionNote state={state} /> : null}
    </form>
  );
}

export function ImportForm({ sources }: { sources: { source: string; name: string }[] }) {
  const [state, action, pending] = useActionState(importFileAction, null as SyncState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Source
        </span>
        <select name="source" className="w-full rounded-[10px] border border-line bg-paper px-3 py-2" required>
          {sources.map((source) => (
            <option key={source.source} value={source.source}>
              {source.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Partner
        </span>
        <input
          name="partner"
          placeholder="Required for DSD and Encompass"
          className="w-full rounded-[10px] border border-line bg-paper px-3 py-2"
        />
      </label>
      <label className="block text-sm sm:col-span-2">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          CSV or TSV
        </span>
        <input
          name="file"
          type="file"
          accept=".csv,.tsv,text/csv,text/tab-separated-values"
          required
          className="block w-full text-sm"
        />
      </label>
      <div className="sm:col-span-2">
        <button type="submit" className={buttonClass} disabled={pending}>
          {pending ? "Importing" : "Import file"}
        </button>
        {state ? (
          <div className="mt-2">
            <ActionNote state={state} />
          </div>
        ) : null}
      </div>
    </form>
  );
}

function ActionNote({ state }: { state: Exclude<SyncState, null> }) {
  return <p className={`text-xs ${state.ok ? "text-muted" : "text-hibiscus"}`}>{state.message}</p>;
}
