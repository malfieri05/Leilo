import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import { directionLabel, NON_REVENUE_TAG_REGEX } from "@/lib/sources/revenue-classification";

export type RevenueRow = {
  orderingMethod: string;
  direction: string;
  directionLabel: string;
  orders: number;
  revenue: number;
};

export type RevenueKpi = {
  label: "Direct" | "DSD" | "KEHE" | "UNFI";
  revenue: number;
  orders: number;
};

export type RevenueReport =
  | { state: "no-database" }
  | { state: "empty" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      rows: RevenueRow[];
      total: number;
      direct: number;
      kpis: RevenueKpi[];
      unclassified: { orders: number; revenue: number };
      reviewOrders: number;
      nonRevenueOrders: number;
      sourceNote: string;
    };

/** Shopify wholesale orders only; HubSpot orders excluded until dedupe rules exist. */
export const REVENUE_ORDER_SOURCE = "shopify";

export async function revenueByOrderingMethod(): Promise<RevenueReport> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [rows, meta] = await Promise.all([
      sql`
        SELECT
          ordering_method,
          direction,
          COUNT(*) FILTER (
            WHERE revenue > 0
              AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
          )::int AS orders,
          COALESCE(
            SUM(revenue) FILTER (
              WHERE revenue > 0
                AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
            ),
            0
          ) AS revenue
        FROM orders
        WHERE organization_id = ${organizationId}
          AND source = ${REVENUE_ORDER_SOURCE}
        GROUP BY ordering_method, direction
        HAVING
          COUNT(*) FILTER (
            WHERE revenue > 0
              AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
          ) > 0
          OR COALESCE(
            SUM(revenue) FILTER (
              WHERE revenue > 0
                AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
            ),
            0
          ) > 0
        ORDER BY ordering_method, direction
      `,
      sql`
        SELECT
          COUNT(*) FILTER (
            WHERE ordering_method = 'Unclassified'
              AND revenue > 0
              AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
          )::int AS unclassified_orders,
          COALESCE(
            SUM(revenue) FILTER (
              WHERE ordering_method = 'Unclassified'
                AND revenue > 0
                AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
            ),
            0
          ) AS unclassified_revenue,
          COUNT(*) FILTER (
            WHERE revenue > 0
              AND NOT (tags ~* ${NON_REVENUE_TAG_REGEX})
              AND (
                ordering_method = 'Unclassified'
                OR exclude_from_direct = true
              )
              AND NOT (
                ordering_method IN ('KEHE', 'UNFI', 'DSD')
                AND direction = 'to'
              )
          )::int AS review_orders,
          COUNT(*) FILTER (
            WHERE tags ~* ${NON_REVENUE_TAG_REGEX}
              OR (revenue IS NOT NULL AND revenue <= 0)
          )::int AS non_revenue_orders
        FROM orders
        WHERE organization_id = ${organizationId}
          AND source = ${REVENUE_ORDER_SOURCE}
      `,
    ]);

    if (rows.length === 0 && Number(meta[0]?.unclassified_orders ?? 0) === 0) {
      return { state: "empty" };
    }

    const shaped: RevenueRow[] = rows.map((row) => ({
      orderingMethod: String(row.ordering_method),
      direction: String(row.direction),
      directionLabel: directionLabel(String(row.direction)),
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    }));

    const kpis = buildKpis(shaped);
    const total = shaped.reduce((sum, row) => sum + row.revenue, 0);
    const direct = kpis.find((kpi) => kpi.label === "Direct")?.revenue ?? 0;

    return {
      state: "ready",
      rows: shaped,
      total,
      direct,
      kpis,
      unclassified: {
        orders: Number(meta[0]?.unclassified_orders ?? 0),
        revenue: Number(meta[0]?.unclassified_revenue ?? 0),
      },
      reviewOrders: Number(meta[0]?.review_orders ?? 0),
      nonRevenueOrders: Number(meta[0]?.non_revenue_orders ?? 0),
      sourceNote: "Shopify wholesale (leilosupply) only. HubSpot orders are excluded.",
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export function buildKpis(rows: RevenueRow[]): RevenueKpi[] {
  const methods = ["Direct", "DSD", "KEHE", "UNFI"] as const;
  return methods.map((label) => {
    const matched =
      label === "Direct"
        ? rows.filter((row) => row.orderingMethod === "Direct" && row.direction === "direct")
        : rows.filter((row) => row.orderingMethod === label && row.direction === "to");
    return {
      label,
      revenue: matched.reduce((sum, row) => sum + row.revenue, 0),
      orders: matched.reduce((sum, row) => sum + row.orders, 0),
    };
  });
}
