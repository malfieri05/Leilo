import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { LeadsChrome, LeadsChromeLive } from "@/components/leads-chrome";
import { LeadsView } from "@/components/leads-view";
import { Panel } from "@/components/panel";
import { ResultsFade } from "@/components/results-fade";
import { listAccounts } from "@/lib/sources/accounts";
import { loadLeads } from "@/lib/sources/leads-overview";
import { parseSalesQuery, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "Lead Generation" };

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

export default function LeadsPage({ searchParams }: PageProps<"/leads">) {
  return (
    <>
      <Suspense fallback={<LeadsChrome query={chromeFallbackQuery} periodLabel="Year to date" compareLabel={null} />}>
        <LeadsChromeLive />
      </Suspense>
      <ResultsFade>
        <Suspense fallback={<LeadsFallback />}>
          <LeadsResults searchParams={searchParams} />
        </Suspense>
      </ResultsFade>
    </>
  );
}

async function LeadsResults({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const parsed = parseSalesQuery(await searchParams);
  return <LeadsBody query={parsed.query} period={parsed.period} today={parsed.today} />;
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
    <div className="grid gap-4 sm:grid-cols-3" aria-hidden>
      <KpiCard label="At Risk" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Past" value="—" delta="Loading" tone="flat" />
      <KpiCard label="Upsell" value="—" delta="Loading" tone="flat" />
    </div>
  );
}