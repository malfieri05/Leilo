import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SpinsFilters } from "@/components/spins-filters";
import { SpinsView } from "@/components/spins-view";
import { loadSpins } from "@/lib/sources/spins-overview";
import { parseSpinsQuery, spinsQueryString, type SpinsQuery } from "@/lib/sources/spins-model";

export const metadata: Metadata = { title: "SPINS Data" };

export default function SpinsPage({ searchParams }: PageProps<"/spins">) {
  return (
    <>
      <PageHeader
        title="SPINS Data"
        description="Category scan dollars from Brand Rank, Item Rank, and the Sprouts item matrix. 4-packs and items under $2,000 stay out of the view."
      />
      <Suspense fallback={<SpinsFallback />}>
        <SpinsFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function SpinsFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const query = parseSpinsQuery(await searchParams);
  const apiConfigured = Boolean(process.env.SPINS_API_KEY?.trim() && process.env.SPINS_API_URL?.trim());
  return (
    <>
      <SpinsFilters key={spinsQueryString(query)} query={query} />
      <Suspense fallback={<SpinsFallback />}>
        <SpinsBody query={query} apiConfigured={apiConfigured} />
      </Suspense>
    </>
  );
}

async function SpinsBody({ query, apiConfigured }: { query: SpinsQuery; apiConfigured: boolean }) {
  const report = await loadSpins(query);
  if (report.state === "no-database") {
    return (
      <Panel title="Database">
        <p className="text-sm text-muted">Add DATABASE_URL to load SPINS extracts.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Could not load SPINS">
        <p className="text-sm text-muted">{report.message}</p>
      </Panel>
    );
  }
  return <SpinsView report={report} query={query} apiConfigured={apiConfigured} />;
}

function SpinsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label="In-view dollars" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Leilo dollars" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Competitor-set dollars" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Rows held out" value="—" delta="Loading" tone="flat" />
    </div>
  );
}
