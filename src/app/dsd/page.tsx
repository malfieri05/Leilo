import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { DsdPartnerFilter } from "@/components/dsd-partner-filter";
import { DsdView } from "@/components/dsd-view";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SalesFilters } from "@/components/sales-filters";
import { compareLabel } from "@/components/sales-overview-view";
import { DSD_PARTNERS } from "@/lib/sources/dsd/partners";
import { loadDsdOverview } from "@/lib/sources/dsd-overview";
import { parseDsdQuery } from "@/lib/sources/dsd-query";
import { salesQueryString, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "DSD" };

export default function DsdPage({ searchParams }: PageProps<"/dsd">) {
  return (
    <>
      <PageHeader
        title="DSD"
        description="Retailer sales through DSD partners, from uploaded reports. This is not Leilo’s invoice to a distributor. Those Shopify orders stay on Sales Overview."
      />
      <Suspense fallback={<DsdFallback />}>
        <DsdFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DsdFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const parsed = parseDsdQuery(await searchParams);
  return (
    <>
      <SalesFilters
        key={salesQueryString(parsed.query)}
        query={parsed.query}
        periodLabel={parsed.period.label}
        compareLabel={compareLabel(parsed.period)}
      />
      <Suspense fallback={<DsdFallback />}>
        <DsdBody query={parsed.query} period={parsed.period} partner={parsed.partner} />
      </Suspense>
    </>
  );
}

async function DsdBody({
  query,
  period,
  partner,
}: {
  query: SalesQuery;
  period: ResolvedPeriod;
  partner: string | null;
}) {
  await connection();
  const report = await loadDsdOverview(query.region, period, partner);
  const options = report.state === "ready" ? report.knownPartners : DSD_PARTNERS.map((item) => ({ slug: item.slug, label: item.label }));
  return (
    <>
      <DsdPartnerFilter query={query} options={options} />
      {report.state === "no-database" ? (
        <Panel title="DSD">
          <p className="text-sm text-muted">The database is not connected.</p>
        </Panel>
      ) : null}
      {report.state === "error" ? (
        <Panel title="DSD">
          <p className="text-sm text-hibiscus">{report.message}</p>
        </Panel>
      ) : null}
      {report.state === "ready" ? <DsdView report={report} period={period} partner={partner} /> : null}
    </>
  );
}

function DsdFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {["DSD Total Revenue", "DSD SKUs Carried", "DSD Total PODs"].map((label) => (
        <KpiCard key={label} label={label} value="—" delta="Loading" tone="flat" />
      ))}
    </div>
  );
}
