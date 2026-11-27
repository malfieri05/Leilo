import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { SalesOverviewChrome, SalesOverviewChromeLive } from "@/components/sales-overview-chrome";
import { SalesChannelBody } from "@/components/sales-channel-body";
import { ResultsFade } from "@/components/results-fade";
import { normalizePartnerName } from "@/lib/sources/dsd/partners";
import { parseSalesQuery, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "Sales Overview" };

const chromeFallbackQuery: SalesQuery = {
  channel: "all",
  region: "nationwide",
  range: "ytd",
  from: null,
  to: null,
  segment: "industry",
  segmentValue: "",
  cohort: null,
  partner: null,
};

export default function SalesOverviewPage({ searchParams }: PageProps<"/sales">) {
  return (
    <>
      <Suspense
        fallback={
          <SalesOverviewChrome query={chromeFallbackQuery} periodLabel="Year to date" compareLabel={null} />
        }
      >
        <SalesOverviewChromeLive />
      </Suspense>
      <ResultsFade>
        <Suspense fallback={<ResultsPlaceholder />}>
          <SalesResults searchParams={searchParams} />
        </Suspense>
      </ResultsFade>
    </>
  );
}

async function SalesResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const parsed = parseSalesQuery(await searchParams);
  const partner =
    parsed.query.channel === "dsd" && parsed.query.partner
      ? normalizePartnerName(parsed.query.partner) || null
      : null;
  const query = partner ? { ...parsed.query, partner } : parsed.query;
  return <SalesChannelBody query={query} period={parsed.period} today={parsed.today} partner={partner} />;
}

function ResultsPlaceholder() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-hidden>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="ark-surface h-28 animate-pulse bg-paper/80" />
      ))}
    </div>
  );
}