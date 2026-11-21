"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  rangeKeys,
  regionKeys,
  salesQueryString,
  segmentLabel,
  type RangeKey,
  type RegionKey,
  type SalesQuery,
  type SegmentKey,
} from "@/lib/sources/sales-overview-model";

const regionLabels: Record<RegionKey, string> = {
  nationwide: "Nationwide",
  california: "California",
  southeast: "Southeast",
};

const rangeLabels: Record<RangeKey, string> = {
  mtd: "MTD",
  ytd: "YTD",
  "ytd-vs": "YTD vs last year",
  custom: "Custom",
  all: "All time",
};

export function SalesFilters({
  query,
  periodLabel,
  compareLabel,
}: {
  query: SalesQuery;
  periodLabel: string;
  compareLabel: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [customOpen, setCustomOpen] = useState(query.range === "custom");
  const [from, setFrom] = useState(query.from ?? "");
  const [to, setTo] = useState(query.to ?? "");

  function go(patch: Partial<SalesQuery>) {
    router.push(`${pathname}${salesQueryString(query, patch)}`);
  }

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Region">
          {regionKeys.map((region) => (
            <FilterButton
              key={region}
              pressed={query.region === region}
              onClick={() => go({ region })}
            >
              {regionLabels[region]}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Period">
          {rangeKeys.map((range) => (
            <FilterButton
              key={range}
              pressed={range === "custom" ? customOpen : query.range === range && !customOpen}
              onClick={() => {
                if (range === "custom") {
                  setCustomOpen(true);
                  return;
                }
                setCustomOpen(false);
                go({ range, from: null, to: null });
              }}
            >
              {rangeLabels[range]}
            </FilterButton>
          ))}
          <p className="text-sm text-muted">
            {periodLabel}
            {compareLabel ? ` · vs ${compareLabel}` : ""}
          </p>
        </div>
        {customOpen ? (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (from && to) go({ range: "custom", from, to });
            }}
          >
            <label className="text-xs uppercase tracking-[0.12em] text-muted">
              From
              <input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                required
                className="mt-1 block rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs uppercase tracking-[0.12em] text-muted">
              To
              <input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                required
                className="mt-1 block rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm text-ink"
              />
            </label>
            <button
              type="submit"
              className="rounded-[10px] bg-heading px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper"
            >
              Apply
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export function SegmentControls({ query, options }: { query: SalesQuery; options: string[] }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(patch: Partial<SalesQuery>) {
    router.push(`${pathname}${salesQueryString(query, patch)}`);
  }

  const segments: { id: SegmentKey; label: string }[] = [
    { id: "industry", label: "Industry Type" },
    { id: "customer", label: "Customer Type" },
  ];

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div role="group" aria-label="Tier segment">
        <div className="flex flex-wrap gap-2">
          {segments.map((segment) => (
            <FilterButton
              key={segment.id}
              pressed={query.segment === segment.id}
              onClick={() => go({ segment: segment.id, segmentValue: "" })}
            >
              {segment.label}
            </FilterButton>
          ))}
        </div>
      </div>
      <label className="text-xs uppercase tracking-[0.12em] text-muted">
        <span className="sr-only">Segment value</span>
        <select
          value={query.segmentValue}
          onChange={(event) => go({ segmentValue: event.target.value })}
          className="rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm normal-case tracking-normal text-ink"
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {segmentLabel(option)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function FilterButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-[10px] border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${
        pressed ? "border-heading bg-heading text-paper" : "border-line bg-paper text-ink hover:border-heading"
      }`}
    >
      {children}
    </button>
  );
}
