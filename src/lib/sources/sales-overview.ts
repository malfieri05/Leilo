import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError, type Sql } from "@/lib/db";
import { NON_REVENUE_TAG_REGEX } from "@/lib/sources/revenue-classification";
import { REVENUE_ORDER_SOURCE } from "@/lib/sources/revenue";
import {
  addDays,
  assignTiers,
  BLANK_SEGMENT,
  productFamilies,
  productFamily,
  segmentLabel,
  type CohortId,
  type ProductFamily,
  type ResolvedPeriod,
  type SalesQuery,
  type TierAccount,
  type TierBand,
} from "@/lib/sources/sales-overview-model";

const SAMPLE_TAG_REGEX = "(^|,\\s*)sample(\\s*,|$)";
/** Kehe and UNFI ship to a warehouse. That account is not a retailer door. */
const NOT_DISTRIBUTOR_ACCOUNT = `AND a.name !~* '\\m(kehe|unfi)\\M'`;
const NAME_LIMIT = 200;

export type MethodStatus = "ready" | "none-landed" | "none-in-period" | "none-in-view" | "not-in-region";

export type MethodCard = {
  label: "Direct" | "DSD" | "KEHE" | "UNFI";
  revenue: number;
  orders: number;
  priorRevenue: number | null;
  share: number | null;
  status: MethodStatus;
};

export type AccountName = { id: string; name: string };

export type SalesOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      total: number;
      priorTotal: number | null;
      methods: MethodCard[];
      distributorNote: string | null;
      unclassifiedOrders: number;
      skus: { sku: string; revenue: number }[];
      families: { family: ProductFamily; revenue: number }[];
      lineRevenue: number;
      health: {
        lifetime: number;
        active: number;
        atRisk: number;
        past: number;
        prospects: number;
      };
      retention: {
        ordered: number;
        yearBuyers: number;
        oneTwo: number;
        threePlus: number;
        yearRecent: number;
        twoYearBuyers: number;
        twoYearRecent: number;
      };
      cohort: { total: number; names: AccountName[] } | null;
      tiers: TierBand[];
      segmentOptions: string[];
      industry: IndustryRow[];
    };

export type IndustryRow = {
  type: string;
  accounts: number;
  revenue: number;
  share: number;
  blankNames: AccountName[];
  blankTotal: number;
};

type SqlRow = Record<string, unknown>;

export async function loadSalesOverview(
  query: SalesQuery,
  period: ResolvedPeriod,
  today: string,
): Promise<SalesOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [methodRows, everRows, skuRows, healthRows, prospectCount, orderedCount, tierRows, industryAccounts, industryRevenue, blank] =
      await Promise.all([
        methodTotals(sql, organizationId, query, period),
        everLanded(sql, organizationId),
        skuTotals(sql, organizationId, query, period),
        healthTotals(sql, organizationId, query, today),
        prospectTotal(sql, organizationId, query),
        orderedTotal(sql, organizationId, query, period),
        tierAccounts(sql, organizationId, query, period),
        industryAccountCounts(sql, organizationId, query),
        industryRevenueTotals(sql, organizationId, query, period),
        blankIndustry(sql, organizationId, query),
      ]);

    const cohort = query.cohort
      ? await cohortNames(sql, organizationId, query, period, today, healthRows, {
          ordered: orderedCount,
          prospects: prospectCount,
        })
      : null;

    const methods = buildMethods(methodRows, everRows, query, period);
    const total = methods.reduce((sum, method) => sum + method.revenue, 0);
    const priorTotal = period.compareFrom ? methods.reduce((sum, method) => sum + (method.priorRevenue ?? 0), 0) : null;
    for (const method of methods) method.share = total > 0 ? method.revenue / total : null;

    const folded = foldLines(skuRows);
    const segmented = tierRows.filter((account) => matchesSegment(account, query));
    const options = segmentOptions(tierRows, query.segment);

    return {
      state: "ready",
      total,
      priorTotal,
      methods,
      distributorNote:
        query.region === "nationwide" ? null : "Distributor invoices are not split by retailer state yet.",
      unclassifiedOrders: query.region === "nationwide" ? unclassifiedInPeriod(methodRows, period) : 0,
      skus: folded.skus,
      families: folded.families,
      lineRevenue: folded.lineRevenue,
      health: {
        lifetime: healthRows.lifetime,
        active: healthRows.active,
        atRisk: healthRows.atRisk,
        past: healthRows.past,
        prospects: prospectCount,
      },
      retention: {
        ordered: orderedCount,
        yearBuyers: healthRows.yearBuyers,
        oneTwo: healthRows.oneTwo,
        threePlus: healthRows.threePlus,
        yearRecent: healthRows.yearRecent,
        twoYearBuyers: healthRows.twoYearBuyers,
        twoYearRecent: healthRows.twoYearRecent,
      },
      cohort,
      tiers: assignTiers(segmented.map((account) => ({ id: account.id, name: account.name, revenue: account.revenue }))),
      segmentOptions: options,
      industry: mergeIndustry(industryAccounts, industryRevenue, blank),
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

const COUNTING = `
  o.revenue > 0
  AND NOT (o.tags ~* $tag)
  AND (
    (o.ordering_method = 'Direct' AND o.direction = 'direct' AND o.exclude_from_direct = false)
    OR (o.ordering_method IN ('KEHE', 'UNFI', 'DSD') AND o.direction = 'to')
  )
`;

async function methodTotals(sql: Sql, organizationId: string, query: SalesQuery, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const region = revenueRegion(query.region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const prior = between("o.ship_date", period.compareFrom, period.compareTo, params);
  return rows(
    await sql.query(
      `SELECT
         o.ordering_method,
         o.direction,
         o.exclude_from_direct,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${current}), 0) AS revenue,
         COUNT(*) FILTER (WHERE ${current})::int AS orders,
         COALESCE(SUM(o.revenue) FILTER (WHERE ${prior}), 0) AS prior_revenue,
         COUNT(*)::int AS in_view
       FROM orders o
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.revenue > 0
         AND NOT (o.tags ~* $3)
         ${region}
       GROUP BY o.ordering_method, o.direction, o.exclude_from_direct`,
      params,
    ),
  );
}

async function everLanded(sql: Sql, organizationId: string) {
  return rows(
    await sql.query(
      `SELECT ordering_method, COUNT(*)::int AS orders
       FROM orders
       WHERE organization_id = $1
         AND source = $2
         AND revenue > 0
         AND NOT (tags ~* $3)
         AND (
           (ordering_method = 'Direct' AND direction = 'direct' AND exclude_from_direct = false)
           OR (ordering_method IN ('KEHE', 'UNFI', 'DSD') AND direction = 'to')
         )
       GROUP BY ordering_method`,
      [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX],
    ),
  );
}

async function skuTotals(sql: Sql, organizationId: string, query: SalesQuery, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const region = revenueRegion(query.region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const counting = countingSql(3);
  return rows(
    await sql.query(
      `SELECT
         COALESCE(NULLIF(btrim(l.sku), ''), '') AS sku,
         COALESCE(l.product_type, '') AS title,
         SUM(l.revenue) AS revenue
       FROM order_lines l
       JOIN orders o ON o.id = l.order_id
       LEFT JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${counting}
         AND ${current}
         AND l.revenue > 0
         ${region}
       GROUP BY 1, 2`,
      params,
    ),
  );
}

async function healthTotals(sql: Sql, organizationId: string, query: SalesQuery, today: string) {
  const built = rolled(organizationId, query, today);
  const result = rows(
    await sql.query(
      `${built.sql}
       SELECT
         COUNT(*)::int AS lifetime,
         COUNT(*) FILTER (WHERE last_ship >= ${built.d90}::date)::int AS active,
         COUNT(*) FILTER (WHERE last_ship < ${built.d90}::date AND last_ship >= ${built.d150}::date)::int AS at_risk,
         COUNT(*) FILTER (WHERE last_ship < ${built.d150}::date)::int AS past,
         COUNT(*) FILTER (WHERE in_year)::int AS year_buyers,
         COUNT(*) FILTER (WHERE in_year AND year_orders BETWEEN 1 AND 2 AND NOT in_90)::int AS one_two,
         COUNT(*) FILTER (WHERE in_year AND year_orders >= 3)::int AS three_plus,
         COUNT(*) FILTER (WHERE in_year AND in_90)::int AS year_recent,
         COUNT(*) FILTER (WHERE in_two_year)::int AS two_year_buyers,
         COUNT(*) FILTER (WHERE in_two_year AND in_90)::int AS two_year_recent
       FROM rolled`,
      built.params,
    ),
  );
  const row = result[0] ?? {};
  return {
    lifetime: num(row.lifetime),
    active: num(row.active),
    atRisk: num(row.at_risk),
    past: num(row.past),
    yearBuyers: num(row.year_buyers),
    oneTwo: num(row.one_two),
    threePlus: num(row.three_plus),
    yearRecent: num(row.year_recent),
    twoYearBuyers: num(row.two_year_buyers),
    twoYearRecent: num(row.two_year_recent),
  };
}

async function prospectTotal(sql: Sql, organizationId: string, query: SalesQuery) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX, SAMPLE_TAG_REGEX];
  const region = accountRegion(query.region, params);
  const result = rows(
    await sql.query(
      `SELECT COUNT(*)::int AS count
       FROM accounts a
       WHERE a.organization_id = $1
         ${region}
         AND ${prospectPredicate()}`,
      params,
    ),
  );
  return num(result[0]?.count);
}

async function orderedTotal(sql: Sql, organizationId: string, query: SalesQuery, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const region = revenueRegion(query.region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const result = rows(
    await sql.query(
      `SELECT COUNT(DISTINCT o.account_id)::int AS count
       FROM orders o
       JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${countingSql(3)}
         AND ${current}
         ${region}`,
      params,
    ),
  );
  return num(result[0]?.count);
}

type TierSource = TierAccount & { industryType: string | null; customerType: string | null };

async function tierAccounts(sql: Sql, organizationId: string, query: SalesQuery, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const region = accountRegion(query.region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  const result = rows(
    await sql.query(
      `SELECT
         a.id::text AS id,
         a.name,
         NULLIF(btrim(a.industry_type), '') AS industry_type,
         NULLIF(btrim(a.customer_type), '') AS customer_type,
         SUM(o.revenue) AS revenue
       FROM orders o
       JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND o.ordering_method = 'Direct'
         AND o.direction = 'direct'
         AND o.exclude_from_direct = false
         AND o.revenue > 0
         AND NOT (o.tags ~* $3)
         AND ${current}
         ${region}
         ${NOT_DISTRIBUTOR_ACCOUNT}
       GROUP BY a.id, a.name, 3, 4
       HAVING SUM(o.revenue) > 0`,
      params,
    ),
  );
  return result.map((row) => ({
    id: text(row.id),
    name: text(row.name),
    revenue: num(row.revenue),
    industryType: blank(row.industry_type),
    customerType: blank(row.customer_type),
  }));
}

async function industryAccountCounts(sql: Sql, organizationId: string, query: SalesQuery) {
  const params: unknown[] = [organizationId];
  const region = accountRegion(query.region, params);
  return rows(
    await sql.query(
      `SELECT COALESCE(NULLIF(btrim(industry_type), ''), '') AS industry, COUNT(*)::int AS accounts
       FROM accounts a
       WHERE a.organization_id = $1
         ${region}
       GROUP BY 1`,
      params,
    ),
  );
}

async function industryRevenueTotals(sql: Sql, organizationId: string, query: SalesQuery, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const region = revenueRegion(query.region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  return rows(
    await sql.query(
      `SELECT COALESCE(NULLIF(btrim(a.industry_type), ''), '') AS industry, SUM(o.revenue) AS revenue
       FROM orders o
       JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${countingSql(3)}
         AND ${current}
         ${region}
       GROUP BY 1`,
      params,
    ),
  );
}

async function blankIndustry(sql: Sql, organizationId: string, query: SalesQuery) {
  const params: unknown[] = [organizationId];
  const region = accountRegion(query.region, params);
  const [countRows, nameRows] = await Promise.all([
    sql.query(
      `SELECT COUNT(*)::int AS count
       FROM accounts a
       WHERE a.organization_id = $1
         AND (industry_type IS NULL OR btrim(industry_type) = '')
         ${region}`,
      params,
    ),
    sql.query(
      `SELECT a.id::text AS id, a.name
       FROM accounts a
       WHERE a.organization_id = $1
         AND (industry_type IS NULL OR btrim(industry_type) = '')
         ${region}
       ORDER BY a.name
       LIMIT ${NAME_LIMIT}`,
      params,
    ),
  ]);
  return {
    total: num(rows(countRows)[0]?.count),
    names: rows(nameRows).map(accountName),
  };
}

async function cohortNames(
  sql: Sql,
  organizationId: string,
  query: SalesQuery,
  period: ResolvedPeriod,
  today: string,
  health: {
    lifetime: number;
    active: number;
    atRisk: number;
    past: number;
    oneTwo: number;
    threePlus: number;
    yearRecent: number;
    twoYearRecent: number;
  },
  totals: { ordered: number; prospects: number },
) {
  const cohort = query.cohort;
  if (!cohort) return null;
  if (cohort === "prospects") {
    return { total: totals.prospects, names: await prospectNames(sql, organizationId, query) };
  }
  if (cohort === "ordered") {
    return { total: totals.ordered, names: await orderedNames(sql, organizationId, query, period) };
  }
  const built = rolled(organizationId, query, today);
  const where = cohortWhere(cohort, built.d90, built.d150);
  const result = rows(
    await sql.query(
      `${built.sql}
       SELECT id, name
       FROM rolled
       WHERE ${where}
       ORDER BY name
       LIMIT ${NAME_LIMIT}`,
      built.params,
    ),
  );
  return { total: cohortTotal(cohort, health), names: result.map(accountName) };
}

function cohortTotal(
  cohort: CohortId,
  health: {
    lifetime: number;
    active: number;
    atRisk: number;
    past: number;
    oneTwo: number;
    threePlus: number;
    yearRecent: number;
    twoYearRecent: number;
  },
) {
  switch (cohort) {
    case "lifetime":
      return health.lifetime;
    case "active":
      return health.active;
    case "at-risk":
      return health.atRisk;
    case "past":
      return health.past;
    case "one-two":
      return health.oneTwo;
    case "three-plus":
      return health.threePlus;
    case "year-recent":
      return health.yearRecent;
    case "two-year":
      return health.twoYearRecent;
    default:
      return 0;
  }
}

async function prospectNames(sql: Sql, organizationId: string, query: SalesQuery) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX, SAMPLE_TAG_REGEX];
  const region = accountRegion(query.region, params);
  return rows(
    await sql.query(
      `SELECT a.id::text AS id, a.name
       FROM accounts a
       WHERE a.organization_id = $1
         ${region}
         AND ${prospectPredicate()}
       ORDER BY a.name
       LIMIT ${NAME_LIMIT}`,
      params,
    ),
  ).map(accountName);
}

async function orderedNames(sql: Sql, organizationId: string, query: SalesQuery, period: ResolvedPeriod) {
  const params: unknown[] = [organizationId, REVENUE_ORDER_SOURCE, NON_REVENUE_TAG_REGEX];
  const region = revenueRegion(query.region, params);
  const current = between("o.ship_date", period.from, period.to, params);
  return rows(
    await sql.query(
      `SELECT a.id::text AS id, a.name
       FROM orders o
       JOIN accounts a ON a.id = o.account_id
       WHERE o.organization_id = $1
         AND o.source = $2
         AND ${countingSql(3)}
         AND ${current}
         ${region}
       GROUP BY a.id, a.name
       ORDER BY a.name
       LIMIT ${NAME_LIMIT}`,
      params,
    ),
  ).map(accountName);
}

function rolled(organizationId: string, query: SalesQuery, today: string) {
  const params: unknown[] = [];
  const org = bind(params, organizationId);
  const source = bind(params, REVENUE_ORDER_SOURCE);
  const tags = bind(params, NON_REVENUE_TAG_REGEX);
  const d90 = bind(params, addDays(today, -90));
  const d150 = bind(params, addDays(today, -150));
  const year = bind(params, addDays(today, -365));
  const two = bind(params, addDays(today, -730));
  const todaySlot = bind(params, today);
  const region = accountRegion(query.region, params);
  const sql = `WITH rolled AS (
    SELECT
      a.id::text AS id,
      a.name,
      MAX(o.ship_date) AS last_ship,
      COUNT(DISTINCT CASE
        WHEN o.ship_date >= ${year}::date AND o.ship_date <= ${todaySlot}::date THEN
          CASE
            WHEN o.ordering_method IN ('KEHE', 'UNFI') THEN to_char(o.ship_date, 'IYYY-IW')
            ELSE o.id::text
          END
      END)::int AS year_orders,
      BOOL_OR(o.ship_date >= ${d90}::date AND o.ship_date <= ${todaySlot}::date) AS in_90,
      BOOL_OR(o.ship_date >= ${d150}::date AND o.ship_date < ${d90}::date) AS in_at_risk,
      BOOL_OR(o.ship_date >= ${year}::date AND o.ship_date <= ${todaySlot}::date) AS in_year,
      BOOL_OR(o.ship_date >= ${two}::date AND o.ship_date <= ${todaySlot}::date) AS in_two_year
    FROM accounts a
    JOIN orders o ON o.account_id = a.id
    WHERE a.organization_id = ${org}
      AND o.organization_id = ${org}
      AND o.source = ${source}
      AND o.revenue > 0
      AND NOT (o.tags ~* ${tags})
      AND o.ship_date IS NOT NULL
      ${region}
    GROUP BY a.id, a.name
  )`;
  return { sql, params, d90, d150 };
}

function cohortWhere(cohort: CohortId, d90: string, d150: string) {
  switch (cohort) {
    case "lifetime":
      return "TRUE";
    case "active":
      return `last_ship >= ${d90}::date`;
    case "at-risk":
      return `last_ship < ${d90}::date AND last_ship >= ${d150}::date`;
    case "past":
      return `last_ship < ${d150}::date`;
    case "one-two":
      return "in_year AND year_orders BETWEEN 1 AND 2 AND NOT in_90";
    case "three-plus":
      return "in_year AND year_orders >= 3";
    case "year-recent":
      return "in_year AND in_90";
    case "two-year":
      return "in_two_year AND in_90";
    default:
      return "FALSE";
  }
}

function prospectPredicate() {
  return `NOT EXISTS (
    SELECT 1 FROM orders o
    WHERE o.account_id = a.id
      AND o.organization_id = $1
      AND o.source = $2
      AND o.revenue > 0
      AND NOT (o.tags ~* $3)
      AND o.ship_date IS NOT NULL
  )
  AND (
    a.customer_type ILIKE '%prospect%'
    OR EXISTS (
      SELECT 1 FROM orders s
      WHERE s.account_id = a.id
        AND s.organization_id = $1
        AND s.source = $2
        AND s.tags ~* $4
    )
  )`;
}

function countingSql(tagSlot: number) {
  return COUNTING.replaceAll("$tag", `$${tagSlot}`);
}

function revenueRegion(region: SalesQuery["region"], params: unknown[]) {
  const states = stateSlots(region, params);
  if (!states) return "";
  return `AND o.ordering_method = 'Direct'
    AND o.direction = 'direct'
    AND o.exclude_from_direct = false
    AND upper(btrim(a.region)) IN (${states})
    ${NOT_DISTRIBUTOR_ACCOUNT}`;
}

function accountRegion(region: SalesQuery["region"], params: unknown[]) {
  const states = stateSlots(region, params);
  if (!states) return "";
  return `AND upper(btrim(a.region)) IN (${states})`;
}

function stateSlots(region: SalesQuery["region"], params: unknown[]) {
  if (region === "nationwide") return "";
  const states = region === "california" ? ["CA"] : ["FL", "GA", "SC", "NC", "MS", "TN", "AL"];
  return states
    .map((state) => {
      params.push(state);
      return `$${params.length}`;
    })
    .join(", ");
}

function between(column: string, from: string | null, to: string | null, params: unknown[]) {
  if (!from || !to) return "TRUE";
  params.push(from, to);
  return `${column} >= $${params.length - 1}::date AND ${column} <= $${params.length}::date`;
}

function bind(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
}

function buildMethods(methodRows: SqlRow[], everRows: SqlRow[], query: SalesQuery, period: ResolvedPeriod): MethodCard[] {
  const ever = new Map(everRows.map((row) => [text(row.ordering_method), num(row.orders)]));
  const labels = ["Direct", "DSD", "KEHE", "UNFI"] as const;
  return labels.map((label) => {
    const matched = methodRows.filter((row) => matchesMethod(row, label));
    const revenue = matched.reduce((sum, row) => sum + num(row.revenue), 0);
    const orders = matched.reduce((sum, row) => sum + num(row.orders), 0);
    const inView = matched.reduce((sum, row) => sum + num(row.in_view), 0);
    const priorRevenue = period.compareFrom ? matched.reduce((sum, row) => sum + num(row.prior_revenue), 0) : null;
    return {
      label,
      revenue,
      orders,
      priorRevenue,
      share: null,
      status: methodStatus(label, query.region, orders, inView, ever.get(label) ?? 0),
    };
  });
}

function matchesMethod(row: SqlRow, label: MethodCard["label"]) {
  if (label === "Direct") {
    return text(row.ordering_method) === "Direct" && text(row.direction) === "direct" && !row.exclude_from_direct;
  }
  return text(row.ordering_method) === label && text(row.direction) === "to";
}

function methodStatus(
  label: MethodCard["label"],
  region: SalesQuery["region"],
  orders: number,
  inView: number,
  ever: number,
): MethodStatus {
  if (label !== "Direct" && region !== "nationwide") {
    return ever > 0 ? "not-in-region" : "none-landed";
  }
  if (orders > 0) return "ready";
  if (ever === 0) return "none-landed";
  if (inView === 0) return "none-in-view";
  return "none-in-period";
}

function unclassifiedInPeriod(methodRows: SqlRow[], period: ResolvedPeriod) {
  if (!period.from) {
    return methodRows
      .filter((row) => text(row.ordering_method) === "Unclassified")
      .reduce((sum, row) => sum + num(row.in_view), 0);
  }
  return methodRows
    .filter((row) => text(row.ordering_method) === "Unclassified")
    .reduce((sum, row) => sum + num(row.orders), 0);
}

function foldLines(skuRows: SqlRow[]) {
  const bySku = new Map<string, { sku: string; revenue: number; skuCode: string | null; titles: string[] }>();
  for (const row of skuRows) {
    const skuCode = text(row.sku);
    const title = text(row.title);
    const key = skuCode || title || "No SKU";
    const current = bySku.get(key) ?? { sku: skuCode || title || "No SKU", revenue: 0, skuCode: skuCode || null, titles: [] };
    current.revenue += num(row.revenue);
    if (title) current.titles.push(title);
    bySku.set(key, current);
  }
  const skus = [...bySku.values()]
    .map((item) => ({ sku: item.sku, revenue: item.revenue, family: familyOf(item) }))
    .sort((a, b) => b.revenue - a.revenue || a.sku.localeCompare(b.sku));
  const totals = new Map<ProductFamily, number>(productFamilies.map((family) => [family, 0]));
  for (const item of skus) totals.set(item.family, (totals.get(item.family) ?? 0) + item.revenue);
  return {
    skus: skus.map((item) => ({ sku: item.sku, revenue: item.revenue })),
    families: productFamilies.map((family) => ({ family, revenue: totals.get(family) ?? 0 })),
    lineRevenue: skus.reduce((sum, item) => sum + item.revenue, 0),
  };
}

function familyOf(item: { skuCode: string | null; titles: string[] }) {
  return productFamily(item.skuCode, item.titles.join(" "));
}

function matchesSegment(account: TierSource, query: SalesQuery) {
  if (!query.segmentValue) return true;
  const value = query.segment === "industry" ? account.industryType : account.customerType;
  if (query.segmentValue === BLANK_SEGMENT) return !value;
  return value === query.segmentValue;
}

function segmentOptions(accounts: TierSource[], segment: SalesQuery["segment"]) {
  const values = new Set<string>();
  for (const account of accounts) {
    const value = segment === "industry" ? account.industryType : account.customerType;
    values.add(value ?? BLANK_SEGMENT);
  }
  return [...values].sort((a, b) => segmentLabel(a).localeCompare(segmentLabel(b)));
}

function mergeIndustry(
  accountRows: SqlRow[],
  revenueRows: SqlRow[],
  blank: { total: number; names: AccountName[] },
): IndustryRow[] {
  const revenueByType = new Map(revenueRows.map((row) => [text(row.industry), num(row.revenue)]));
  const seen = new Set<string>();
  const merged: IndustryRow[] = [];
  for (const row of accountRows) {
    const type = text(row.industry);
    seen.add(type);
    merged.push({
      type: type || "Needs a type",
      accounts: num(row.accounts),
      revenue: revenueByType.get(type) ?? 0,
      share: 0,
      blankNames: type ? [] : blank.names,
      blankTotal: type ? 0 : blank.total,
    });
  }
  for (const [type, revenue] of revenueByType) {
    if (seen.has(type) || revenue <= 0) continue;
    merged.push({
      type: type || "Needs a type",
      accounts: 0,
      revenue,
      share: 0,
      blankNames: type ? [] : blank.names,
      blankTotal: type ? 0 : blank.total,
    });
  }
  const total = merged.reduce((sum, row) => sum + row.revenue, 0);
  for (const row of merged) row.share = total > 0 ? row.revenue / total : 0;
  return merged.sort((a, b) => {
    if (a.type === "Needs a type") return -1;
    if (b.type === "Needs a type") return 1;
    return b.revenue - a.revenue || a.type.localeCompare(b.type);
  });
}

function accountName(row: SqlRow): AccountName {
  return { id: text(row.id), name: text(row.name) || "Unnamed account" };
}

function rows(value: unknown) {
  return Array.isArray(value) ? (value as SqlRow[]) : [];
}

function num(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function blank(value: unknown) {
  const trimmed = text(value).trim();
  return trimmed || null;
}
