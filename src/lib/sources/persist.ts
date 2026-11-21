import type { Sql } from "@/lib/db";
import { chunk } from "@/lib/sources/fields";
import type {
  AccountDraft,
  KeheInventoryDraft,
  OrderDraft,
  PullResult,
  RawDraft,
  ShipmentDraft,
  SpinsRowDraft,
} from "@/lib/sources/types";

type Stored = {
  accounts: AccountDraft[];
  orders: OrderDraft[];
  shipments: ShipmentDraft[];
  raw: RawDraft[];
  inventory?: KeheInventoryDraft[];
  spinsRows?: SpinsRowDraft[];
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
      const base = index * 12;
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
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)}, ${slot(8)}, ${slot(9)}, ${slot(10)}, ${slot(11)}, ${slot(12)})`;
    });
    const rows = (await sql.query(
      `INSERT INTO orders (
        organization_id, source, external_id, account_id, ordering_method, direction,
        ship_date, revenue, currency, tags, exclude_from_direct, partner
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
      const base = index * 9;
      params.push(
        organizationId,
        source,
        shipment.externalId,
        shipment.orderExternalId,
        shipment.status,
        shipment.deliveredAt,
        shipment.carrier,
        shipment.trackingNumber,
        shipment.relevantUntil,
      );
      const slot = (offset: number) => `$${base + offset}`;
      return `(${slot(1)}, ${slot(2)}, ${slot(3)}, ${slot(4)}, ${slot(5)}, ${slot(6)}, ${slot(7)}, ${slot(8)}, ${slot(9)})`;
    });
    await sql.query(
      `INSERT INTO shipments (
        organization_id, source, external_id, order_external_id, status,
        delivered_at, carrier, tracking_number, relevant_until
      ) VALUES ${values.join(", ")}
      ON CONFLICT (organization_id, source, external_id)
      DO UPDATE SET
        order_external_id = EXCLUDED.order_external_id,
        status = EXCLUDED.status,
        delivered_at = EXCLUDED.delivered_at,
        carrier = EXCLUDED.carrier,
        tracking_number = EXCLUDED.tracking_number,
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
