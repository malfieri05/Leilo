"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { SlideToggle } from "@/components/slide-toggle";
import {
  calendarStartMonth,
  monthName,
  promoPairTitle,
  promoMonthPair,
  promoQueryString,
  PROMO_CHANNELS,
  PROMO_VIEWS,
  shiftPromoWindow,
  type PromoChannelFilter,
  type PromoQuery,
  type PromoView,
} from "@/lib/sources/promo-model";

const years = [2025, 2026, 2027] as const;
type YearKey = `${(typeof years)[number]}`;

const promoChannelLabels: Record<PromoChannelFilter, string> = {
  all: "All channels",
  kehe: "KEHE",
  unfi: "UNFI",
  direct: "Direct",
  dsd: "DSD",
};

const promoViewLabels: Record<PromoView, string> = {
  calendar: "Calendar",
  agenda: "Agenda",
  matrix: "Matrix",
};

type MonthToggleKey = "all" | `${number}`;

const monthOptions: { id: MonthToggleKey; label: string }[] = [
  { id: "all", label: "All months" },
  ...Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return { id: String(month) as MonthToggleKey, label: monthName(month).slice(0, 3) };
  }),
];

function mergePromoQuery(query: PromoQuery, patch: Partial<PromoQuery>): PromoQuery {
  const next = { ...query, ...patch };
  if (next.view === "calendar" && next.month === "all") {
    next.month = new Date().getMonth() + 1;
  }
  if (next.view !== "calendar" && patch.view && patch.view !== "calendar" && query.view === "calendar") {
    next.month = "all";
  }
  return next;
}

export function PromosFilters({ query }: { query: PromoQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  function hrefFor(patch: Partial<PromoQuery>) {
    return `${pathname}${promoQueryString(mergePromoQuery(query, patch), {})}`;
  }

  function go(patch: Partial<PromoQuery>) {
    startTransition(() => {
      router.push(hrefFor(patch), { scroll: false });
    });
  }

  function intent(patch: Partial<PromoQuery>) {
    router.prefetch(hrefFor(patch));
  }

  useEffect(() => {
    for (const year of years) {
      router.prefetch(hrefFor({ year }));
    }
    for (const channel of PROMO_CHANNELS) {
      router.prefetch(hrefFor({ channel }));
    }
    for (const view of PROMO_VIEWS) {
      router.prefetch(hrefFor({ view }));
    }
  }, [pathname, query, router]);

  const start = calendarStartMonth(query);
  const [left, right] = promoMonthPair(start.year, start.month);
  const pairTitle = promoPairTitle(left, right);
  const monthValue: MonthToggleKey = query.month === "all" ? "all" : (String(query.month) as MonthToggleKey);

  function shiftWindow(delta: number) {
    const next = shiftPromoWindow(start.year, start.month, delta);
    go({ year: next.year, month: next.month });
  }

  return (
    <div className="sticky top-16 z-10 -mx-4 mb-6 border-b border-line bg-foam/95 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
      <div className="flex flex-col items-start gap-2.5">
        <div className="max-w-full overflow-x-auto">
          <SlideToggle
            label="Year"
            value={String(query.year) as YearKey}
            options={years.map((year) => ({ id: String(year) as YearKey, label: String(year) }))}
            onIntent={(year) => intent({ year: Number(year) })}
            onChange={(year) => go({ year: Number(year) })}
          />
        </div>

        <div className="max-w-full overflow-x-auto">
          <SlideToggle
            label="Channel"
            value={query.channel}
            options={PROMO_CHANNELS.map((channel) => ({ id: channel, label: promoChannelLabels[channel] }))}
            onIntent={(channel) => intent({ channel })}
            onChange={(channel) => go({ channel })}
          />
        </div>

        <div className="flex w-full flex-col gap-2.5 border-t border-line pt-2.5 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="max-w-full overflow-x-auto">
              <SlideToggle
                label="Month"
                value={monthValue}
                options={monthOptions}
                onIntent={(month) => intent({ month: month === "all" ? "all" : Number(month) })}
                onChange={(month) => go({ month: month === "all" ? "all" : Number(month) })}
              />
            </div>
          )}

          <div className="max-w-full overflow-x-auto sm:shrink-0">
            <SlideToggle
              label="View"
              value={query.view}
              options={PROMO_VIEWS.map((view) => ({ id: view, label: promoViewLabels[view] }))}
              onIntent={(view) => intent(view === "calendar" ? { view, month: start.month } : { view })}
              onChange={(view) => {
                if (view === "calendar") go({ view, month: start.month });
                else go({ view });
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-lg text-heading shadow-[0_1px_2px_rgba(15,23,42,0.08)] ring-1 ring-transparent transition-colors hover:ring-lime"
    >
      {children}
    </button>
  );
}