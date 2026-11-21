import { Suspense, type ReactNode } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { DirectView } from "@/components/direct-view";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SalesFilters } from "@/components/sales-filters";
import { compareLabel } from "@/components/sales-overview-view";
import { loadDirectOverview } from "@/lib/sources/direct-overview";
import { exclusionReason, listShopifyOrders, type OrderList, type OrderRow } from "@/lib/sources/orders";
import { parseSalesQuery, salesQueryString, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export const metadata: Metadata = { title: "Direct" };

export default function DirectPage({ searchParams }: PageProps<"/direct">) {
  return (
    <>
      <PageHeader
        title="Direct"
        description="Retailers ordering from Leilo on leilosupply. KEHE, UNFI, and DSD invoices stay out, along with sample, POS, and merch tags. Independent and Regional Distributors stay out when HubSpot Industry Type says so."
      />
      <Suspense fallback={<DirectFallback />}>
        <DirectFrame searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function DirectFrame({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await connection();
  const parsed = parseSalesQuery(await searchParams);
  return (
    <>
      <SalesFilters
        key={salesQueryString(parsed.query)}
        query={parsed.query}
        periodLabel={parsed.period.label}
        compareLabel={compareLabel(parsed.period)}
      />
      <Suspense fallback={<DirectFallback />}>
        <DirectBody query={parsed.query} period={parsed.period} today={parsed.today} />
      </Suspense>
    </>
  );
}

async function DirectBody({ query, period, today }: { query: SalesQuery; period: ResolvedPeriod; today: string }) {
  await connection();
  const [report, included, held] = await Promise.all([
    loadDirectOverview(query.region, period, today),
    listShopifyOrders({ excluded: false, limit: 25 }),
    listShopifyOrders({ excluded: true, limit: 25 }),
  ]);
  if (report.state === "no-database") {
    return (
      <Panel title="Direct">
        <p className="text-sm text-muted">The database is not connected.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Direct">
        <p className="text-sm text-hibiscus">{report.message}</p>
      </Panel>
    );
  }
  return (
    <>
      <DirectView report={report} period={period} />
      <details className="mt-4 rounded-[10px] border border-line bg-paper px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-heading">Order audit</summary>
        <div className="mt-4 flex flex-col gap-4">
          <Panel title="Direct orders sample" action={actionLabel(included, "Shopify · leilosupply")}>
            <OrderTable
              list={included}
              empty="No Direct Shopify orders yet. Sync Shopify on Sources."
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
          <Panel title="Held out of Direct" action={actionLabel(held, "Distributor and non-revenue tags")}>
            <OrderTable
              list={held}
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
        </div>
      </details>
    </>
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

function DirectFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {[
        "Direct Total Revenue",
        "Direct SKUs Carried",
        "Direct Total PODs",
        "Direct accounts, 30 days",
        "Direct accounts, 60 days",
        "Direct accounts, 90 days",
      ].map((label) => (
        <KpiCard key={label} label={label} value="—" delta="Loading" tone="flat" />
      ))}
    </div>
  );
}
