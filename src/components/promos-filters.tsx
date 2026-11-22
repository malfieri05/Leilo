"use client";

import { usePathname, useRouter } from "next/navigation";
import { monthName, promoQueryString, PROMO_CHANNELS, type PromoQuery } from "@/lib/sources/promo-model";

const years = [2025, 2026, 2027];

export function PromosFilters({ query }: { query: PromoQuery }) {
  const router = useRouter();
  const pathname = usePathname();

  function go(patch: Partial<PromoQuery>) {
    router.push(`${pathname}${promoQueryString(query, patch)}`);
  }

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Year">
          {years.map((year) => (
            <FilterButton key={year} pressed={query.year === year} onClick={() => go({ year })}>
              {year}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Month">
          <FilterButton pressed={query.month === "all"} onClick={() => go({ month: "all" })}>
            All months
          </FilterButton>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <FilterButton key={month} pressed={query.month === month} onClick={() => go({ month })}>
              {monthName(month).slice(0, 3)}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Channel">
          {PROMO_CHANNELS.map((channel) => (
            <FilterButton key={channel} pressed={query.channel === channel} onClick={() => go({ channel })}>
              {channel === "all" ? "All channels" : channel.toUpperCase()}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="View">
          <FilterButton pressed={query.view === "agenda"} onClick={() => go({ view: "agenda" })}>
            Agenda
          </FilterButton>
          <FilterButton pressed={query.view === "matrix"} onClick={() => go({ view: "matrix" })}>
            Matrix
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
