import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SalesFilters } from "@/components/sales-filters";
import { UnfiView } from "@/components/unfi-view";
import { compareLabel } from "@/components/sales-overview-view";
import { parseSalesQuery, salesQueryString, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";
import { loadUnfiOverview } from "@/lib/sources/unfi-overview";

export const metadata: Metadata = { title: "UNFI" };

export default function UnfiPage({ searchParams }: PageProps<"/unfi">) {
  return (
    <>
      <PageHeader
        title="UNFI"
        description="UNFI’s sales through to retailers, using the same data points as KEHE. This is not Leilo’s invoice to UNFI. The channel stays empty until a sales-through file is imported."
      />
      <Suspense fallback={<UnfiFallback />}>
        <UnfiFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function UnfiFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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
      <Suspense fallback={<UnfiFallback />}>
        <UnfiBody query={parsed.query} period={parsed.period} />
      </Suspense>
    </>
  );
}

async function UnfiBody({ query, period }: { query: SalesQuery; period: ResolvedPeriod }) {
  await connection();
  const report = await loadUnfiOverview(query.region, period);
  if (report.state === "no-database") {
    return (
      <Panel title="UNFI">
        <p className="text-sm text-muted">The database is not connected.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="UNFI">
        <p className="text-sm text-hibiscus">{report.message}</p>
      </Panel>
    );
  }
  return <UnfiView report={report} period={period} />;
}

function UnfiFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {["UNFI Total Locations", "UNFI Total Revenue", "UNFI SKUs Carried", "UNFI Total PODs"].map((label) => (
        <KpiCard key={label} label={label} value="—" delta="Loading" tone="flat" />
      ))}
    </div>
  );
}
