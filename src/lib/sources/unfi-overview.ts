import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import {
  industryTotals,
  salesSyncedAt,
  salesTotals,
  skuCuts,
  type ThroughIndustryRow,
  type ThroughSkuRow,
} from "@/lib/sources/distributor-through-queries";
import { distributorFlowForChannel, type DistributorFlowRow } from "@/lib/sources/sales-to-through";
import type { ProductFamily, RegionKey, ResolvedPeriod } from "@/lib/sources/sales-overview-model";

export type UnfiOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      locations: number;
      revenue: number;
      priorRevenue: number | null;
      skusCarried: number;
      pods: number;
      skus: ThroughSkuRow[];
      families: { family: ProductFamily; revenue: number }[];
      industry: ThroughIndustryRow[];
      salesSyncedAt: string | null;
      latestShip: string | null;
      distributorFlow: DistributorFlowRow;
    };

export async function loadUnfiOverview(region: RegionKey, period: ResolvedPeriod): Promise<UnfiOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [sales, cuts, industry, synced, distributorFlow] = await Promise.all([
      salesTotals(sql, organizationId, "unfi", region, period),
      skuCuts(sql, organizationId, "unfi", region, period),
      industryTotals(sql, organizationId, "unfi", region, period),
      salesSyncedAt(sql, organizationId, "unfi"),
      distributorFlowForChannel(sql, organizationId, "UNFI", region, period),
    ]);
    return {
      state: "ready",
      locations: sales.locations,
      revenue: sales.revenue,
      priorRevenue: period.compareFrom ? sales.priorRevenue : null,
      skusCarried: sales.skus,
      pods: sales.pods,
      skus: cuts.skus,
      families: cuts.families,
      industry,
      salesSyncedAt: synced,
      latestShip: sales.latestShip,
      distributorFlow,
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}
