import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { LeadsView } from "@/components/leads-view";
import { Panel } from "@/components/panel";
import { SalesFilters } from "@/components/sales-filters";
import { compareLabel } from "@/components/sales-overview-view";
import { listAccounts } from "@/lib/sources/accounts";
import { loadLeads } from "@/lib/sources/leads-overview";
import { parseSalesQuery, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "Lead Generation" };

export default function LeadsPage({ searchParams }: PageProps<"/leads">) {
  return (
    <Suspense fallback={<LeadsFallback />}>
      <LeadsFrame searchParams={searchParams} />
    </Suspense>
  );
}

async function LeadsFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const parsed = parseSalesQuery(await searchParams);
  return (
    <>
      <SalesFilters
        query={parsed.query}
        periodLabel={parsed.period.label}
        compareLabel={compareLabel(parsed.period)}
      />
      <Suspense fallback={<LeadsFallback />}>
        <LeadsBody query={parsed.query} period={parsed.period} today={parsed.today} />
      </Suspense>
    </>
  );
}

async function LeadsBody({ query, period, today }: { query: SalesQuery; period: ResolvedPeriod; today: string }) {
  const [report, prospects] = await Promise.all([
    loadLeads(query.region, period, today),
    listAccounts({ prospects: true, limit: 50 }),
  ]);
  if (report.state === "no-database") {
    return (
      <Panel title="Database">
        <p className="text-sm text-muted">Add DATABASE_URL to load lead lists.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Could not load leads">
        <p className="text-sm text-muted">{report.message}</p>
      </Panel>
    );
  }
  return <LeadsView report={report} prospects={prospects} period={period} />;
}

function LeadsFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <KpiCard label="At Risk" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Past" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Upsell" value="—" delta="Loading" tone="flat" />
    </div>
  );
}
