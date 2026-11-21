import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { exclusionReason, listShopifyOrders, type OrderList, type OrderRow } from "@/lib/sources/orders";

export const metadata: Metadata = { title: "Direct" };

export default function DirectPage() {
  return (
    <>
      <PageHeader
        title="Direct"
        description="Wholesale orders placed with Leilo on leilosupply. Distributor-tagged orders stay out of this total and show as sales to the distributor."
      />
      <Suspense fallback={<Panel title="Direct orders">Loading Shopify orders.</Panel>}>
        <DirectOrders />
      </Suspense>
      <div className="mt-4">
        <Suspense fallback={<Panel title="Held out of Direct">Loading held orders.</Panel>}>
          <HeldOrders />
        </Suspense>
      </div>
    </>
  );
}

async function DirectOrders() {
  await connection();
  const list = await listShopifyOrders({ excluded: false, limit: 100 });
  return (
    <Panel title="Direct orders" action={actionLabel(list, "Shopify · leilosupply")}>
      <OrderTable
        list={list}
        empty="No Direct Shopify orders yet. Sync Shopify on Sources. POS, merch, and sample tags stay on the order."
        columns={["Order", "Account", "Ship date", "Revenue", "Tags"]}
        render={(order) => (
          <>
            <td className="py-3 font-medium">{order.externalId}</td>
            <td className="py-3">{order.accountName ?? "—"}</td>
            <td className="py-3">{order.shipDate ?? "—"}</td>
            <td className="py-3">{dollars(order.revenue)}</td>
            <td className="py-3 text-muted">{order.tags || "—"}</td>
          </>
        )}
      />
    </Panel>
  );
}

async function HeldOrders() {
  await connection();
  const list = await listShopifyOrders({ excluded: true, limit: 100 });
  return (
    <Panel title="Held out of Direct" action={actionLabel(list, "Distributor tags")}>
      <OrderTable
        list={list}
        empty="No orders are tagged KEHE, UNFI, DSD, or distributor yet."
        columns={["Order", "Method", "Direction", "Revenue", "Why excluded"]}
        render={(order) => (
          <>
            <td className="py-3 font-medium">{order.externalId}</td>
            <td className="py-3">{order.orderingMethod}</td>
            <td className="py-3">{order.direction === "to" ? "To the distributor" : order.direction}</td>
            <td className="py-3">{dollars(order.revenue)}</td>
            <td className="py-3 text-muted">{exclusionReason(order)}</td>
          </>
        )}
      />
    </Panel>
  );
}

function OrderTable({
  list,
  empty,
  columns,
  render,
}: {
  list: OrderList;
  empty: string;
  columns: string[];
  render: (order: OrderRow) => ReactNode;
}) {
  return (
    <>
      {list.state === "error" ? <p className="text-sm text-hibiscus">{list.message}</p> : null}
      {list.state === "no-database" ? <p className="text-sm text-muted">The database is not connected.</p> : null}
      {list.state === "empty" ? (
        <p className="text-sm text-muted">
          {empty}{" "}
          <Link href="/sources" className="font-semibold text-heading underline">
            Open Sources
          </Link>
          .
        </p>
      ) : null}
      {list.state === "ready" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="pb-3 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.rows.map((order) => (
                <tr key={order.externalId} className="border-t border-line">
                  {render(order)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

function actionLabel(list: OrderList, fallback: string) {
  if (list.state === "ready" || list.state === "empty") {
    const showing = list.state === "ready" ? list.rows.length : 0;
    return list.total ? `${showing} of ${list.total}` : fallback;
  }
  return fallback;
}

function dollars(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
