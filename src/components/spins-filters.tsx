"use client";

import { usePathname, useRouter } from "next/navigation";
import { regionKeys, regionLabel, type RegionKey } from "@/lib/sources/sales-overview-model";
import {
  reportLabel,
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  spinsQueryString,
  type SpinsQuery,
  type SpinsScope,
} from "@/lib/sources/spins-model";

export function SpinsFilters({ query }: { query: SpinsQuery }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(patch: Partial<SpinsQuery>) {
    router.push(`${pathname}${spinsQueryString(query, patch)}`);
  }

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Report">
          {SPINS_REPORT_KINDS.map((report) => (
            <FilterButton key={report} pressed={query.report === report} onClick={() => go({ report })}>
              {reportLabel(report)}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="SPINS period">
          {SPINS_PERIOD_WEEKS.map((weeks) => (
            <FilterButton key={weeks} pressed={query.weeks === weeks} onClick={() => go({ weeks })}>
              {weeks} weeks
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Region">
          {regionKeys.map((region) => (
            <FilterButton key={region} pressed={query.region === region} onClick={() => go({ region: region as RegionKey })}>
              {regionLabel(region)}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Brand scope">
          <FilterButton pressed={query.scope === "competitors"} onClick={() => go({ scope: "competitors" satisfies SpinsScope })}>
            Competitors
          </FilterButton>
          <FilterButton pressed={query.scope === "all"} onClick={() => go({ scope: "all" })}>
            All brands in view
          </FilterButton>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: React.ReactNode }) {
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
