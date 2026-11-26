"use client";

import { useSearchParams } from "next/navigation";
import { SalesFilters } from "@/components/sales-filters";
import { compareLabel } from "@/components/sales-overview-view";
import { parseSalesQuery, type SalesQuery } from "@/lib/sources/sales-overview-model";

export function LeadsChromeLive() {
  const search = useSearchParams();
  const input: Record<string, string> = {};
  search.forEach((value, key) => {
    input[key] = value;
  });
  const parsed = parseSalesQuery(input);
  return (
    <LeadsChrome
      query={parsed.query}
      periodLabel={parsed.period.label}
      compareLabel={compareLabel(parsed.period)}
    />
  );
}

export function LeadsChrome({
  query,
  periodLabel,
  compareLabel: compare,
}: {
  query: SalesQuery;
  periodLabel: string;
  compareLabel: string | null;
}) {
  return <SalesFilters query={query} periodLabel={periodLabel} compareLabel={compare} />;
}