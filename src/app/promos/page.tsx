import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { PromoFilterStats } from "@/components/promo-filter-stats";
import { PromosChrome, PromosChromeLive } from "@/components/promos-chrome";
import { PromosView } from "@/components/promos-view";
import { ResultsFade } from "@/components/results-fade";
import { loadPromos } from "@/lib/sources/promo-overview";
import { parsePromoQuery, promoEventsInWindow, type PromoQuery } from "@/lib/sources/promo-model";

export const metadata: Metadata = { title: "Promotion calendar" };

const chromeFallbackQuery: PromoQuery = {
  year: 2026,
  month: 11,
  channel: "all",
  view: "calendar",
};

export default function PromosPage({ searchParams }: PageProps<"/promos">) {
  return (
    <>
      <Suspense fallback={<PromosChrome query={chromeFallbackQuery} />}>
        <PromosChromeLive />
      </Suspense>
      <ResultsFade>
        <Suspense fallback={<PromosPlaceholder />}>
          <PromosResults searchParams={searchParams} />
        </Suspense>
      </ResultsFade>
    </>
  );
}

async function PromosResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const today = new Date();
  const query = parsePromoQuery(await searchParams, today);
  const report = await loadPromos(query);
  if (report.state === "no-database") {
    return (
      <Panel title="Database">
        <p className="text-sm text-muted">Add DATABASE_URL to load the promotion calendar.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Could not load promotions">
        <p className="text-sm text-muted">{report.message}</p>
      </Panel>
    );
  }
  const counts =
    query.view === "calendar" ? promoEventsInWindow(report.yearAgenda, query, today) : report.summary;

  return (
    <>
      <PromoFilterStats counts={counts} />
      <PromosView report={report} query={query} />
    </>
  );
}

function PromosPlaceholder() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-[10px] bg-paper ring-1 ring-line" />
      ))}
    </div>
  );
}