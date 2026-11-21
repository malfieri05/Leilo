import { normalizePartnerName } from "@/lib/sources/dsd/partners";
import { parseSalesQuery, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export function parseDsdQuery(
  input: Record<string, string | string[] | undefined>,
  now = new Date(),
): { query: SalesQuery; period: ResolvedPeriod; today: string; partner: string | null } {
  const parsed = parseSalesQuery(input, now);
  const partner = parsed.query.partner ? normalizePartnerName(parsed.query.partner) : null;
  return {
    ...parsed,
    partner: partner || null,
    query: { ...parsed.query, partner: partner || null },
  };
}
