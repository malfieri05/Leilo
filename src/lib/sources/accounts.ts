import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";

export type AccountRow = {
  externalId: string;
  name: string;
  customerType: string | null;
  orderingMethod: string | null;
  industryType: string | null;
  region: string | null;
  source: string;
};

export type CountRow = { label: string; count: number };

export type AccountCounts =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      total: number;
      bySource: CountRow[];
      byCustomerType: CountRow[];
      byOrderingMethod: CountRow[];
    };

export type AccountList =
  | { state: "no-database" }
  | { state: "empty"; total: number }
  | { state: "error"; message: string }
  | { state: "ready"; rows: AccountRow[]; total: number };

type ListInput = {
  source?: string;
  prospects?: boolean;
  limit?: number;
  offset?: number;
};

export async function accountCounts(source?: string): Promise<AccountCounts> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const filter = where({ organizationId, source });
    const [totalRows, bySource, byCustomerType, byOrderingMethod] = await Promise.all([
      sql.query(
        `SELECT COUNT(*)::int AS count FROM accounts ${filter.clause}`,
        filter.params,
      ),
      sql.query(
        `SELECT source AS label, COUNT(*)::int AS count
         FROM accounts ${filter.clause}
         GROUP BY source
         ORDER BY count DESC, source`,
        filter.params,
      ),
      sql.query(
        `SELECT COALESCE(NULLIF(btrim(customer_type), ''), 'Unset') AS label, COUNT(*)::int AS count
         FROM accounts ${filter.clause}
         GROUP BY 1
         ORDER BY count DESC, label`,
        filter.params,
      ),
      sql.query(
        `SELECT COALESCE(NULLIF(btrim(ordering_method), ''), 'Unset') AS label, COUNT(*)::int AS count
         FROM accounts ${filter.clause}
         GROUP BY 1
         ORDER BY count DESC, label`,
        filter.params,
      ),
    ]);

    return {
      state: "ready",
      total: Number(rowAt(totalRows, 0).count ?? 0),
      bySource: asCounts(bySource),
      byCustomerType: asCounts(byCustomerType),
      byOrderingMethod: asCounts(byOrderingMethod),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

export async function listAccounts(input: ListInput = {}): Promise<AccountList> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  const limit = clamp(input.limit ?? 50, 1, 200);
  const offset = Math.max(input.offset ?? 0, 0);

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const filter = where({ organizationId, source: input.source, prospects: input.prospects });
    const [countRows, rows] = await Promise.all([
      sql.query(`SELECT COUNT(*)::int AS count FROM accounts ${filter.clause}`, filter.params),
      sql.query(
        `SELECT external_id, name, customer_type, ordering_method, industry_type, region, source
         FROM accounts ${filter.clause}
         ORDER BY name
         LIMIT $${filter.params.length + 1}
         OFFSET $${filter.params.length + 2}`,
        [...filter.params, limit, offset],
      ),
    ]);
    const total = Number(rowAt(countRows, 0).count ?? 0);
    if (total === 0) return { state: "empty", total: 0 };
    return {
      state: "ready",
      total,
      rows: asRows(rows).map((row) => ({
        externalId: String(row.external_id),
        name: String(row.name),
        customerType: blank(row.customer_type),
        orderingMethod: blank(row.ordering_method),
        industryType: blank(row.industry_type),
        region: blank(row.region),
        source: String(row.source),
      })),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

function where(input: { organizationId: string; source?: string; prospects?: boolean }) {
  const params: unknown[] = [input.organizationId];
  const parts = ["organization_id = $1"];
  if (input.source) {
    params.push(input.source);
    parts.push(`source = $${params.length}`);
  }
  if (input.prospects) {
    parts.push(`(
      customer_type IS NULL
      OR btrim(customer_type) = ''
      OR customer_type ILIKE 'prospect'
    )`);
  }
  return { clause: `WHERE ${parts.join(" AND ")}`, params };
}

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function rowAt(value: unknown, index: number) {
  return asRows(value)[index] ?? {};
}

function asCounts(value: unknown): CountRow[] {
  return asRows(value).map((row) => ({ label: String(row.label), count: Number(row.count) }));
}

function blank(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
