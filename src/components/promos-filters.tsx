"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  calendarStartMonth,
  monthName,
  promoPairTitle,
  promoMonthPair,
  promoQueryString,
  PROMO_CHANNELS,
  shiftPromoWindow,
  type PromoQuery,
} from "@/lib/sources/promo-model";

const years = [2025, 2026, 2027];

export function PromosFilters({
  query,
  counts,
}: {
  query: PromoQuery;
  counts?: { shown: number; cancelled: number; kehe: number; unfi: number };
}) {
  const router = useRouter();
  const pathname = usePathname();

  function go(patch: Partial<PromoQuery>) {
    const next = { ...query, ...patch };
    if (next.view === "calendar" && next.month === "all") {
      next.month = new Date().getMonth() + 1;
    }
    if (next.view !== "calendar" && patch.view && patch.view !== "calendar" && query.view === "calendar") {
      next.month = "all";
    }
    router.push(`${pathname}${promoQueryString(next, {})}`);
  }

  const start = calendarStartMonth(query);
  const [left, right] = promoMonthPair(start.year, start.month);
  const pairTitle = promoPairTitle(left, right);

  function shiftWindow(delta: number) {
    const next = shiftPromoWindow(start.year, start.month, delta);
    go({ year: next.year, month: next.month });
  }

  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 border border-line bg-paper px-4 py-4 shadow-sm md:-mx-8 md:rounded-[10px] md:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Year">
            {years.map((year) => (
              <FilterButton key={year} pressed={query.year === year} onClick={() => go({ year })}>
                {year}
              </FilterButton>
            ))}
          </div>
          {counts ? (
            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              <StatPair label="In view" value={counts.shown} />
              <StatPair label="Cancelled" value={counts.cancelled} />
              <StatPair label="KEHE" value={counts.kehe} />
              <StatPair label="UNFI" value={counts.unfi} />
            </dl>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Channel">
          {PROMO_CHANNELS.map((channel) => (
            <FilterButton key={channel} pressed={query.channel === channel} onClick={() => go({ channel })}>
              {channel === "all" ? "All channels" : channel.toUpperCase()}
            </FilterButton>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          {query.view === "calendar" ? (
            <div className="flex items-center gap-2">
              <NavButton label="Previous two months" onClick={() => shiftWindow(-2)}>
                ‹
              </NavButton>
              <p className="min-w-[12rem] text-center font-display text-base text-heading sm:min-w-[16rem]">{pairTitle}</p>
              <NavButton label="Next two months" onClick={() => shiftWindow(2)}>
                ›
              </NavButton>
            </div>
          ) : (
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
          )}

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="View">
            <FilterButton pressed={query.view === "calendar"} onClick={() => go({ view: "calendar", month: start.month })}>
              Calendar
            </FilterButton>
            <FilterButton pressed={query.view === "agenda"} onClick={() => go({ view: "agenda" })}>
              Agenda
            </FilterButton>
            <FilterButton pressed={query.view === "matrix"} onClick={() => go({ view: "matrix" })}>
              Matrix
            </FilterButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPair({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="uppercase tracking-[0.1em]">{label}</dt>
      <dd className="font-display text-sm text-heading">{value}</dd>
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
        pressed ? "border-heading bg-heading text-paper" : "border-line bg-foam text-ink hover:border-heading"
      }`}
    >
      {children}
    </button>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-foam text-lg text-heading hover:border-heading"
    >
      {children}
    </button>
  );
}