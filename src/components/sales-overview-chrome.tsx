"use client";

import { useSearchParams } from "next/navigation";
import { SalesFilters } from "@/components/sales-filters";
import { normalizePartnerName } from "@/lib/sources/dsd/partners";
import { formatSpan, parseSalesQuery, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export function SalesOverviewChromeLive() {
  const search = useSearchParams();
  const input: Record<string, string> = {};
  search.forEach((value, key) => {
    input[key] = value;
  });
  const parsed = parseSalesQuery(input);
  const partner =
    parsed.query.channel === "dsd" && parsed.query.partner
      ? normalizePartnerName(parsed.query.partner) || null
      : null;
  const query = partner ? { ...parsed.query, partner } : parsed.query;

  return (
    <SalesOverviewChrome
      query={query}
      periodLabel={parsed.period.label}
      compareLabel={compareText(parsed.period)}
    />
  );
}

export function SalesOverviewChrome({
  query,
  periodLabel,
  compareLabel,
}: {
  query: SalesQuery;
  periodLabel: string;
  compareLabel: string | null;
}) {
  return (
    <SalesFilters
      query={query}
      periodLabel={periodLabel}
      compareLabel={compareLabel}
      showChannelFilter
    />
  );
}

function compareText(period: ResolvedPeriod) {
  if (!period.compareFrom || !period.compareTo) return null;
  return formatSpan(period.compareFrom, period.compareTo);
}