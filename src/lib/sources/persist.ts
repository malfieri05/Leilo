import type { Sql } from "@/lib/db";
import { chunk } from "@/lib/sources/fields";
import type {
  AccountDraft,
  KeheInventoryDraft,
  OrderDraft,
  PullResult,
  RawDraft,
  ShipmentDraft,
  PromoEventDraft,
  PromoSnapshotDraft,
  SkuCatalogDraft,
  SpinsRowDraft,
} from "@/lib/sources/types";

type Stored = {
  accounts: AccountDraft[];
  orders: OrderDraft[];
  shipments: ShipmentDraft[];
  raw: RawDraft[];
  inventory?: KeheInventoryDraft[];
  spinsRows?: SpinsRowDraft[];
  skuCatalog?: SkuCatalogDraft[];
  promoEvents?: PromoEventDraft[];
  promoSnapshot?: PromoSnapshotDraft;
};

export async function persistBundle(
  sql: Sql,
  input: {
    organizationId: string;
    source: string;
    partner: string;
    syncRunId: string;
    bundle: Stored;
  },
) {
  const accounts = dedupe(input.bundle.accounts, (account) => account.externalId);
  const orders = dedupe(input.bundle.orders, (order) => order.externalId);
  const shipments = dedupe(input.bundle.shipments, (shipment) => shipment.externalId);
  const accountIds = await upsertAccounts(sql, input.organizationId, input.source, accounts);
  const orderIds = await upsertOrders(
    sql,
    input.organizationId,
    input.source,
    orders,
    accountIds,
  );
  await replaceLines(sql, orders, orderIds);
  await upsertShipments(sql, input.organizationId, input.source, shipments);
  await insertInventory(sql, input.organizationId, input.syncRunId, input.bundle.inventory ?? []);
  await insertSpinsRows(sql, input.organizationId, input.syncRunId, input.bundle.spinsRows ?? []);
  if (input.bundle.skuCatalog) {
    await replaceSkuCatalog(sql, input.organizationId, input.syncRunId, input.bundle.skuCatalog);
  }
  if (input.bundle.promoEvents) {
    await replacePromoEvents(sql, input.organizationId, input.syncRunId, input.bundle.promoEvents);
  }
  if (input.bundle.promoSnapshot) {
    await replacePromoSnapshot(sql, input.organizationId, input.syncRunId, input.bundle.promoSnapshot);
  }
  await insertRaw(sql, input, input.bundle.raw);
}

function dedupe<T>(items: T[], key: (item: T) => string) {
  const map = new Map<string, T>();
  for (const item of items) map.set(key(item), item);
  return [...map.values()];
}

async function upsertAccounts(
  sql: Sql,
  organizationId: string,
  source: string,
  accounts: AccountDraft[],
) {
  const ids = new Map<string, string>();
  for (const group of chunk(accounts, 40)) {
    const params: unknown[] = [];
    const values = group.map((account, index) => {
      const base = index * 9;
      params.push(
        organizationId,
        source,
        account.externalId,
        account.name,
        account.address,
        account.region,
        account.industryType,
        account.customerType,
        account.orderingMethod,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)}, ${slot(8)}, ${slot(9)})`;
    });
    const rows = (await sql.query(
      `INSERT INTO accounts (
        organization_id, source, external_id, name, address, region,
        industry_type, customer_type, ordering_method
      ) VALUES ${values.join(", ")}
      ON CONFLICT (organization_id, source, external_id)
      DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        region = EXCLUDED.region,
        industry_type = EXCLUDED.industry_type,
        customer_type = EXCLUDED.customer_type,
        ordering_method = EXCLUDED.ordering_method,
        updated_at = now()
      RETURNING id, external_id`,
      params,
    )) as { id: string; external_id: string }[];
    for (const row of rows) ids.set(row.external_id, row.id);
  }
  return ids;
}

async function upsertOrders(
  sql: Sql,
  organizationId: string,
  source: string,
  orders: OrderDraft[],
  accountIds: Map<string, string>,
) {
  const ids = new Map<string, string>();
  for (const group of chunk(orders, 30)) {
    const params: unknown[] = [];
    const values = group.map((order, index) => {
      const base = index * 13;
      params.push(
        organizationId,
        source,
        order.externalId,
        order.accountExternalId ? (accountIds.get(order.accountExternalId) ?? null) : null,
        order.orderingMethod,
        order.direction,
        order.shipDate,
        order.revenue,
        order.currency,
        order.tags,
        order.excludeFromDirect,
        order.partner,
        order.reference ?? null,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)}, ${slot(8)}, ${slot(9)}, ${slot(10)}, ${slot(11)}, ${slot(12)}, ${slot(13)})`;
    });
    const rows = (await sql.query(
      `INSERT INTO orders (
        organization_id, source, external_id, account_id, ordering_method, direction,
        ship_date, revenue, currency, tags, exclude_from_direct, partner, reference
      ) VALUES ${values.join(", ")}
      ON CONFLICT (organization_id, source, external_id)
      DO UPDATE SET
        account_id = EXCLUDED.account_id,
        ordering_method = EXCLUDED.ordering_method,
        direction = EXCLUDED.direction,
        ship_date = EXCLUDED.ship_date,
        revenue = EXCLUDED.revenue,
        currency = EXCLUDED.currency,
        tags = EXCLUDED.tags,
        exclude_from_direct = EXCLUDED.exclude_from_direct,
        partner = EXCLUDED.partner,
        reference = EXCLUDED.reference,
        updated_at = now()
      RETURNING id, external_id`,
      params,
    )) as { id: string; external_id: string }[];
    for (const row of rows) ids.set(row.external_id, row.id);
  }
  return ids;
}

async function replaceLines(sql: Sql, orders: OrderDraft[], orderIds: Map<string, string>) {
  const ids = [...orderIds.values()];
  for (const group of chunk(ids, 100)) {
    const slots = group.map((_, index) => `$${index + 1}`).join(", ");
    await sql.query(`DELETE FROM order_lines WHERE order_id IN (${slots})`, group);
  }

  const lines = orders.flatMap((order) => {
    const orderId = orderIds.get(order.externalId);
    if (!orderId) return [];
    return order.lines
      .filter((line) => line.sku || line.productType || line.quantity !== null || line.revenue !== null)
      .map((line) => ({ orderId, ...line }));
  });

  for (const group of chunk(lines, 80)) {
    const params: unknown[] = [];
    const values = group.map((line, index) => {
      const base = index * 7;
      params.push(
        line.orderId,
        line.sku,
        line.productType,
        line.quantity,
        line.revenue,
        line.casesOrdered ?? null,
        line.casesShipped ?? null,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)})`;
    });
    await sql.query(
      `INSERT INTO order_lines (
        order_id, sku, product_type, quantity, revenue, cases_ordered, cases_shipped
      ) VALUES ${values.join(", ")}`,
      params,
    );
  }
}

async function upsertShipments(
  sql: Sql,
  organizationId: string,
  source: string,
  shipments: ShipmentDraft[],
) {
  for (const group of chunk(shipments, 40)) {
    const params: unknown[] = [];
    const values = group.map((shipment, index) => {
      const base = index * 11;
      params.push(
        organizationId,
        source,
        shipment.externalId,
        shipment.orderExternalId,
        shipment.status,
        shipment.deliveredAt,
        shipment.carrier,
        shipment.trackingNumber,
        shipment.trackingUrl ?? null,
        shipment.destination ?? null,
        shipment.relevantUntil,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)}, ${slot(8)}, ${slot(9)}, ${slot(10)}, ${slot(11)})`;
    });
    await sql.query(
      `INSERT INTO shipments (
        organization_id, source, external_id, order_external_id, status,
        delivered_at, carrier, tracking_number, tracking_url, destination, relevant_until
      ) VALUES ${values.join(", ")}
      ON CONFLICT (organization_id, source, external_id)
      DO UPDATE SET
        order_external_id = EXCLUDED.order_external_id,
        status = EXCLUDED.status,
        delivered_at = EXCLUDED.delivered_at,
        carrier = EXCLUDED.carrier,
        tracking_number = EXCLUDED.tracking_number,
        tracking_url = EXCLUDED.tracking_url,
        destination = EXCLUDED.destination,
        relevant_until = EXCLUDED.relevant_until,
        updated_at = now()`,
      params,
    );
  }
}

async function insertInventory(
  sql: Sql,
  organizationId: string,
  syncRunId: string,
  rows: KeheInventoryDraft[],
) {
  for (const group of chunk(rows, 40)) {
    const params: unknown[] = [];
    const values = group.map((row, index) => {
      const base = index * 14;
      params.push(
        organizationId,
        syncRunId,
        row.dcCode,
        row.dcName,
        row.rowKind,
        row.upc,
        row.sku,
        row.description,
        row.qtyOnHand,
        row.qtyOnPo,
        row.weeksOnHand,
        row.weeksOnPo,
        row.qtyOnSalesOrder,
        row.vendorCasePack,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((n) => slot(n)).join(", ")})`;
    });
    await sql.query(
      `INSERT INTO kehe_inventory_snapshots (
        organization_id, sync_run_id, dc_code, dc_name, row_kind, upc, sku, description,
        qty_on_hand, qty_on_po, weeks_on_hand, weeks_on_po, qty_on_sales_order, vendor_case_pack
      ) VALUES ${values.join(", ")}`,
      params,
    );
  }
}

async function insertSpinsRows(sql: Sql, organizationId: string, syncRunId: string, rows: SpinsRowDraft[]) {
  for (const group of chunk(rows, 20)) {
    const params: unknown[] = [];
    const values = group.map((row, index) => {
      const base = index * 16;
      params.push(
        organizationId,
        syncRunId,
        row.reportKind,
        row.periodWeeks,
        row.brand,
        row.itemLabel,
        row.upc,
        row.retailer,
        row.geography,
        row.dollars,
        row.units,
        row.rank,
        row.dollarsPct,
        row.unitsPct,
        row.included,
        JSON.stringify(row.payload),
      );
      const slot = (offset: number) => `$${base + offset}`;
      const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((n) => slot(n));
      return `(${cols.join(", ")}, ${slot(16)}::jsonb)`;
    });
    await sql.query(
      `INSERT INTO spins_rows (
        organization_id, sync_run_id, report_kind, period_weeks, brand, item_label, upc, retailer,
        geography, dollars, units, rank, dollars_pct_chg, units_pct_chg, included, payload
      ) VALUES ${values.join(", ")}`,
      params,
    );
  }
}

async function replaceSkuCatalog(sql: Sql, organizationId: string, syncRunId: string, rows: SkuCatalogDraft[]) {
  const kept = dedupe(rows, (row) => row.catalogKey);
  for (const group of chunk(kept, 15)) {
    const params: unknown[] = [];
    const values = group.map((row, index) => {
      const base = index * 29;
      params.push(
        organizationId,
        syncRunId,
        row.catalogKey,
        row.effectiveDate,
        row.category,
        row.itemNumber,
        row.keheEsn,
        row.unitUpc,
        row.caseUpc,
        row.gtin,
        row.ranking,
        row.description,
        row.innerPack,
        row.masterPack,
        row.unitSize,
        row.fobUnit,
        row.fobInner,
        row.fobCase,
        row.deliveredUnit,
        row.deliveredInner,
        row.deliveredCase,
        row.dsdUnit,
        row.dsdInner,
        row.dsdCase,
        row.msrp,
        JSON.stringify(row.logistics),
        row.isFourPack,
        row.format,
        JSON.stringify(row.payload),
      );
      const slot = (offset: number) => `$${base + offset}`;
      const cols = Array.from({ length: 25 }, (_, offset) => slot(offset + 1));
      return `(${cols.join(", ")}, ${slot(26)}::jsonb, ${slot(27)}, ${slot(28)}, ${slot(29)}::jsonb)`;
    });
    await sql.query(
      `INSERT INTO sku_catalog (
        organization_id, sync_run_id, catalog_key, effective_date, category, item_number, kehe_esn,
        unit_upc, case_upc, gtin, ranking, description, inner_pack, master_pack, unit_size,
        fob_unit, fob_inner, fob_case, delivered_unit, delivered_inner, delivered_case,
        dsd_unit, dsd_inner, dsd_case, msrp, logistics, is_four_pack, format, payload
      ) VALUES ${values.join(", ")}
      ON CONFLICT (organization_id, catalog_key) DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        effective_date = EXCLUDED.effective_date,
        category = EXCLUDED.category,
        item_number = EXCLUDED.item_number,
        kehe_esn = EXCLUDED.kehe_esn,
        unit_upc = EXCLUDED.unit_upc,
        case_upc = EXCLUDED.case_upc,
        gtin = EXCLUDED.gtin,
        ranking = EXCLUDED.ranking,
        description = EXCLUDED.description,
        inner_pack = EXCLUDED.inner_pack,
        master_pack = EXCLUDED.master_pack,
        unit_size = EXCLUDED.unit_size,
        fob_unit = EXCLUDED.fob_unit,
        fob_inner = EXCLUDED.fob_inner,
        fob_case = EXCLUDED.fob_case,
        delivered_unit = EXCLUDED.delivered_unit,
        delivered_inner = EXCLUDED.delivered_inner,
        delivered_case = EXCLUDED.delivered_case,
        dsd_unit = EXCLUDED.dsd_unit,
        dsd_inner = EXCLUDED.dsd_inner,
        dsd_case = EXCLUDED.dsd_case,
        msrp = EXCLUDED.msrp,
        logistics = EXCLUDED.logistics,
        is_four_pack = EXCLUDED.is_four_pack,
        format = EXCLUDED.format,
        payload = EXCLUDED.payload`,
      params,
    );
  }
  const keys = kept.map((row) => row.catalogKey);
  await sql.query(
    `DELETE FROM sku_catalog WHERE organization_id = $1 AND NOT (catalog_key = ANY($2::text[]))`,
    [organizationId, keys],
  );
}

async function replacePromoEvents(sql: Sql, organizationId: string, syncRunId: string, rows: PromoEventDraft[]) {
  const kept = dedupe(rows, (row) => row.eventKey);
  for (const group of chunk(kept, 20)) {
    const params: unknown[] = [];
    const values = group.map((row, index) => {
      const base = index * 16;
      params.push(
        organizationId,
        syncRunId,
        row.eventKey,
        row.account,
        row.accountType,
        row.distributor,
        row.channel,
        row.year,
        row.month,
        row.monthLabel,
        row.summary,
        row.status,
        row.startDate,
        row.endDate,
        row.rowOrder,
        row.notes,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${Array.from({ length: 16 }, (_, offset) => slot(offset + 1)).join(", ")})`;
    });
    await sql.query(
      `INSERT INTO promo_events (
        organization_id, sync_run_id, event_key, account, account_type, distributor, channel,
        year, month, month_label, summary, status, start_date, end_date, row_order, notes
      ) VALUES ${values.join(", ")}
      ON CONFLICT (organization_id, event_key) DO UPDATE SET
        sync_run_id = EXCLUDED.sync_run_id,
        account = EXCLUDED.account,
        account_type = EXCLUDED.account_type,
        distributor = EXCLUDED.distributor,
        channel = EXCLUDED.channel,
        year = EXCLUDED.year,
        month = EXCLUDED.month,
        month_label = EXCLUDED.month_label,
        summary = EXCLUDED.summary,
        status = EXCLUDED.status,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        row_order = EXCLUDED.row_order,
        notes = EXCLUDED.notes`,
      params,
    );
  }
  await sql.query(`DELETE FROM promo_events WHERE organization_id = $1 AND NOT (event_key = ANY($2::text[]))`, [
    organizationId,
    kept.map((row) => row.eventKey),
  ]);
}

async function replacePromoSnapshot(sql: Sql, organizationId: string, syncRunId: string, snapshot: PromoSnapshotDraft) {
  await sql.query(
    `INSERT INTO promo_calendar_snapshots (organization_id, sync_run_id, title, source_note, matrix)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (organization_id) DO UPDATE SET
       sync_run_id = EXCLUDED.sync_run_id,
       title = EXCLUDED.title,
       source_note = EXCLUDED.source_note,
       matrix = EXCLUDED.matrix`,
    [organizationId, syncRunId, snapshot.title, snapshot.sourceNote, JSON.stringify({ months: snapshot.months, rows: snapshot.rows })],
  );
}

async function insertRaw(
  sql: Sql,
  input: { organizationId: string; source: string; partner: string; syncRunId: string },
  raw: RawDraft[],
) {
  for (const group of chunk(raw, 40)) {
    const params: unknown[] = [];
    const values = group.map((item, index) => {
      const base = index * 7;
      params.push(
        input.syncRunId,
        input.organizationId,
        input.source,
        input.partner,
        item.kind,
        item.externalId,
        JSON.stringify(item.payload),
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)}::jsonb)`;
    });
    await sql.query(
      `INSERT INTO raw_payloads (
        sync_run_id, organization_id, source, partner, kind, external_id, payload
      ) VALUES ${values.join(", ")}`,
      params,
    );
  }
}

export function emptyPull(message: string, skipped = false): PullResult {
  return {
    message,
    rowCount: 0,
    skipped,
    accounts: [],
    orders: [],
    shipments: [],
    raw: [],
  };
}
