import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SalesFilters } from "@/components/sales-filters";
import { compareLabel, SalesOverviewView } from "@/components/sales-overview-view";
import { loadSalesOverview } from "@/lib/sources/sales-overview";
import { parseSalesQuery, salesQueryString, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "Sales Overview" };

export default function SalesOverviewPage({ searchParams }: PageProps<"/sales">) {
  return (
    <>
      <PageHeader
        title="Sales Overview"
        description="Wholesale health at a glance. Revenue is by ship date and includes Leilo’s sales to KEHE, UNFI, and DSD. Account health is as of today."
      />
      <Suspense fallback={<OverviewFallback />}>
        <SalesFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SalesFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const parsed = parseSalesQuery(await searchParams);
  return (
    <>
      <SalesFilters
        key={salesQueryString(parsed.query)}
        query={parsed.query}
        periodLabel={parsed.period.label}
        compareLabel={compareLabel(parsed.period)}
      />
      <Suspense fallback={<OverviewFallback />}>
        <SalesBody query={parsed.query} period={parsed.period} today={parsed.today} />
      </Suspense>
    </>
  );
}

async function SalesBody({
  query,
  period,
  today,
}: {
  query: SalesQuery;
  period: ResolvedPeriod;
  today: string;
}) {
  await connection();
  const report = await loadSalesOverview(query, period, today);
  if (report.state === "no-database") {
    return (
      <Panel title="Sales Overview">
        <p className="text-sm text-muted">The database is not connected.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Sales Overview">
        <p className="text-sm text-hibiscus">{report.message}</p>
      </Panel>
    );
  }
  return <SalesOverviewView query={query} period={period} report={report} />;
}

function OverviewFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {["Total revenue", "Direct", "DSD", "KEHE", "UNFI"].map((label) => (
        <KpiCard key={label} label={label} value="—" delta="Loading" tone="flat" />
      ))}
    </div>
  );
}
