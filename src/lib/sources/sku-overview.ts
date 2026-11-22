import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import type { SkuCatalogDraft } from "@/lib/sources/types";

export type SkuRow = SkuCatalogDraft & { supplementFactsUrl: string | null };

export type SkuOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      syncedAt: string | null;
      effectiveDate: string | null;
      sheetLink: string | null;
      rows: SkuRow[];
      summary: { total: number; fourPacks: number; singles: number; sticks: number; byCategory: { category: string; count: number }[] };
    };

export async function loadSkuCatalog(): Promise<SkuOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const sheetId = process.env.GOOGLE_SHEET_SKU_ID?.trim() ?? "";
    const rows = asRows(
      await sql.query(
        `SELECT
           catalog_key, effective_date::text AS effective_date, category, item_number, kehe_esn,
           unit_upc, case_upc, gtin, ranking, description, inner_pack, master_pack, unit_size,
           fob_unit, fob_inner, fob_case, delivered_unit, delivered_inner, delivered_case,
           dsd_unit, dsd_inner, dsd_case, msrp, logistics, is_four_pack, format, supplement_facts_url,
           s.finished_at
         FROM sku_catalog k
         LEFT JOIN sync_runs s ON s.id = k.sync_run_id
         WHERE k.organization_id = $1
         ORDER BY k.category, k.ranking NULLS LAST, k.description`,
        [organizationId],
      ),
    );
    const catalog = rows.map(toRow);
    const fourPacks = catalog.filter((row) => row.format === "four-pack").length;
    const sticks = catalog.filter((row) => row.format === "stick").length;
    const byCategory = new Map<string, number>();
    for (const row of catalog) byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
    return {
      state: "ready",
      syncedAt: text(rows[0]?.finished_at) || null,
      effectiveDate: catalog[0]?.effectiveDate ?? null,
      sheetLink: sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}` : null,
      rows: catalog,
      summary: {
        total: catalog.length,
        fourPacks,
        singles: catalog.filter((row) => row.format === "single").length,
        sticks,
        byCategory: [...byCategory.entries()].map(([category, count]) => ({ category, count })),
      },
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

function toRow(row: Record<string, unknown>): SkuRow {
  return {
    catalogKey: text(row.catalog_key),
    effectiveDate: text(row.effective_date) || null,
    category: text(row.category),
    itemNumber: text(row.item_number) || null,
    keheEsn: text(row.kehe_esn) || null,
    unitUpc: text(row.unit_upc) || null,
    caseUpc: text(row.case_upc) || null,
    gtin: text(row.gtin) || null,
    ranking: row.ranking == null ? null : num(row.ranking),
    description: text(row.description),
    innerPack: text(row.inner_pack) || null,
    masterPack: row.master_pack == null ? null : num(row.master_pack),
    unitSize: text(row.unit_size) || null,
    fobUnit: moneyOrNull(row.fob_unit),
    fobInner: moneyOrNull(row.fob_inner),
    fobCase: moneyOrNull(row.fob_case),
    deliveredUnit: moneyOrNull(row.delivered_unit),
    deliveredInner: moneyOrNull(row.delivered_inner),
    deliveredCase: moneyOrNull(row.delivered_case),
    dsdUnit: moneyOrNull(row.dsd_unit),
    dsdInner: moneyOrNull(row.dsd_inner),
    dsdCase: moneyOrNull(row.dsd_case),
    msrp: moneyOrNull(row.msrp),
    logistics: record(row.logistics),
    isFourPack: Boolean(row.is_four_pack),
    format: formatOf(text(row.format)),
    supplementFactsUrl: text(row.supplement_facts_url) || null,
    payload: [],
  };
}

function formatOf(value: string): SkuRow["format"] {
  if (value === "four-pack" || value === "stick") return value;
  return "single";
}

function record(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, String(item ?? "")]));
  }
  if (typeof value === "string") {
    try {
      return record(JSON.parse(value));
    } catch {
      return {};
    }
  }
  return {};
}

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function num(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function moneyOrNull(value: unknown) {
  if (value == null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}
