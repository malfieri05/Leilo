"use client";

import { useActionState, useState } from "react";
import { importFileAction, syncSourceAction } from "@/app/sources/actions";
import { DSD_PARTNERS } from "@/lib/sources/dsd/partners";
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
      {state && !state.ok ? <ActionNote state={state} /> : null}
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
      {state && !state.ok ? <ActionNote state={state} /> : null}
    </form>
  );
}

export function ImportForm({ sources }: { sources: { source: string; name: string }[] }) {
  const [state, action, pending] = useActionState(importFileAction, null as SyncState);
  const [source, setSource] = useState(sources[0]?.source ?? "");
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Source
        </span>
        <select
          name="source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          className="w-full rounded-[10px] border border-line bg-paper px-3 py-2"
          required
        >
          {sources.map((item) => (
            <option key={item.source} value={item.source}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      {source === "spins" ? (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              SPINS report
            </span>
            <select name="reportKind" className="w-full rounded-[10px] border border-line bg-paper px-3 py-2" required defaultValue="">
              <option value="" disabled>
                Choose a report
              </option>
              <option value="brand-rank">Brand Rank</option>
              <option value="item-rank">Item Rank</option>
              <option value="sprouts-matrix">Sprouts Item Matrix</option>
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              SPINS period
            </span>
            <select name="periodWeeks" className="w-full rounded-[10px] border border-line bg-paper px-3 py-2" required defaultValue="12">
              <option value="4">4 weeks</option>
              <option value="12">12 weeks</option>
              <option value="24">24 weeks</option>
              <option value="52">52 weeks</option>
            </select>
          </label>
        </>
      ) : source === "sku-pricelist" || source === "promo-calendar" ? null : source === "kehe" || source === "unfi" ? (
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Distributor report type
          </span>
          <select name="reportKind" className="w-full rounded-[10px] border border-line bg-paper px-3 py-2" required defaultValue="">
            <option value="" disabled>
              Choose a report
            </option>
            <option value="sales-through">Chains and Stores that ordered an Item</option>
            {source === "kehe" ? <option value="stock-status">Stock Status Report</option> : null}
          </select>
        </label>
      ) : (
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Partner
          </span>
          <input
            name="partner"
            list="dsd-partners"
            placeholder="Required for DSD and Encompass"
            className="w-full rounded-[10px] border border-line bg-paper px-3 py-2"
          />
          <datalist id="dsd-partners">
            {DSD_PARTNERS.map((partner) => (
              <option key={partner.slug} value={partner.label} />
            ))}
          </datalist>
        </label>
      )}
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
