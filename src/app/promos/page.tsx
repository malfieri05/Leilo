import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { PromosFilters } from "@/components/promos-filters";
import { PromosView } from "@/components/promos-view";
import { loadPromos } from "@/lib/sources/promo-overview";
import { parsePromoQuery, promoQueryString } from "@/lib/sources/promo-model";

export const metadata: Metadata = { title: "Promotion calendar" };

export default function PromosPage({ searchParams }: PageProps<"/promos">) {
  return (
    <>
      <PageHeader
        title="Promotion Calendar"
        description="KEHE and UNFI promotions for the year, as a month agenda or the full calendar matrix."
      />
      <Suspense fallback={<Panel title="Promotions"><p className="text-sm text-muted">Loading the calendar.</p></Panel>}>
        <PromosFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function PromosFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
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
  return (
    <>
      <PromosFilters key={promoQueryString(query, {}, today)} query={query} />
      <PromosView report={report} query={query} />
    </>
  );
}
