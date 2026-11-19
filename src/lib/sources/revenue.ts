import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";

export type RevenueRow = {
  orderingMethod: string;
  direction: string;
  directionLabel: string;
  orders: number;
  revenue: number;
};

export type RevenueReport =
  | { state: "no-database" }
  | { state: "empty" }
  | { state: "error"; message: string }
  | { state: "ready"; rows: RevenueRow[]; total: number; direct: number };

const directionLabels: Record<string, string> = {
  direct: "Direct",
  to: "To the distributor",
  through: "Through to the retailer",
};

export async function revenueByOrderingMethod(): Promise<RevenueReport> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const rows = await sql`
      SELECT
        ordering_method,
        direction,
        COUNT(*)::int AS orders,
        COALESCE(SUM(revenue), 0) AS revenue
      FROM orders
      WHERE organization_id = ${organizationId}
      GROUP BY ordering_method, direction
      ORDER BY ordering_method, direction
    `;
    if (rows.length === 0) return { state: "empty" };

    const shaped = rows.map((row) => ({
      orderingMethod: String(row.ordering_method),
      direction: String(row.direction),
      directionLabel: directionLabels[String(row.direction)] ?? String(row.direction),
      orders: Number(row.orders),
      revenue: Number(row.revenue),
    }));
    const total = shaped.reduce((sum, row) => sum + row.revenue, 0);
    const direct = shaped
      .filter((row) => row.orderingMethod === "Direct" && row.direction === "direct")
      .reduce((sum, row) => sum + row.revenue, 0);
    return { state: "ready", rows: shaped, total, direct };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}
