import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { KeheView } from "@/components/kehe-view";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SalesFilters } from "@/components/sales-filters";
import { compareLabel } from "@/components/sales-overview-view";
import { loadKeheOverview } from "@/lib/sources/kehe-overview";
import { parseSalesQuery, salesQueryString, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "KEHE" };

export default function KehePage({ searchParams }: PageProps<"/kehe">) {
  return (
    <>
      <PageHeader
        title="KEHE"
        description="KEHE’s sales through to retailers, using shipped revenue. This is not Leilo’s invoice to KEHE. Fill rate is cases shipped divided by cases ordered."
      />
      <Suspense fallback={<KeheFallback />}>
        <KeheFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function KeheFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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
      <Suspense fallback={<KeheFallback />}>
        <KeheBody query={parsed.query} period={parsed.period} today={parsed.today} />
      </Suspense>
    </>
  );
}

async function KeheBody({ query, period, today }: { query: SalesQuery; period: ResolvedPeriod; today: string }) {
  await connection();
  const report = await loadKeheOverview(query.region, period, today);
  if (report.state === "no-database") {
    return (
      <Panel title="KEHE">
        <p className="text-sm text-muted">The database is not connected.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="KEHE">
        <p className="text-sm text-hibiscus">{report.message}</p>
      </Panel>
    );
  }
  return <KeheView report={report} period={period} />;
}

function KeheFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {["KEHE Total Locations", "KEHE Total Revenue", "KEHE SKUs Carried", "KEHE Total PODs", "KEHE Fill Rate"].map(
        (label) => (
          <KpiCard key={label} label={label} value="—" delta="Loading" tone="flat" />
        ),
      )}
    </div>
  );
}
