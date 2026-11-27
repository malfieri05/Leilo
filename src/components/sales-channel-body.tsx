import Link from "next/link";
import type { ReactNode } from "react";
import { DsdPartnerFilter } from "@/components/dsd-partner-filter";
import { DirectView } from "@/components/direct-view";
import { DsdView } from "@/components/dsd-view";
import { KeheView } from "@/components/kehe-view";
import { Panel } from "@/components/panel";
import { SalesOverviewView, compareLabel } from "@/components/sales-overview-view";
import { UnfiView } from "@/components/unfi-view";
import { loadDirectOverview } from "@/lib/sources/direct-overview";
import { DSD_PARTNERS } from "@/lib/sources/dsd/partners";
import { loadDsdOverview } from "@/lib/sources/dsd-overview";
import { loadKeheOverview } from "@/lib/sources/kehe-overview";
import { exclusionReason, listShopifyOrders, type OrderList, type OrderRow } from "@/lib/sources/orders";
import { loadSalesOverview } from "@/lib/sources/sales-overview";
import type { ResolvedPeriod, SalesQuery } from "@/lib/sources/sales-overview-model";
import { loadUnfiOverview } from "@/lib/sources/unfi-overview";

export async function SalesChannelBody({
  query,
  period,
  today,
  partner,
}: {
  query: SalesQuery;
  period: ResolvedPeriod;
  today: string;
  partner: string | null;
}) {
  if (query.channel === "all") {
    const report = await loadSalesOverview(query, period, today);
    if (report.state === "no-database") {
      return (
        <Panel title="Sales Overview">
          <p className="text-sm text-muted">The database is not connected.</p>
        </Panel>
      );
    }
    if (report.state === "error") {
      return (
        <Panel title="Sales Overview">
          <p className="text-sm text-hibiscus">{report.message}</p>
        </Panel>
      );
    }
    return <SalesOverviewView query={query} period={period} report={report} />;
  }

  if (query.channel === "direct") {
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

  if (query.channel === "kehe") {
    const report = await loadKeheOverview(query.region, period, today);
    if (report.state === "no-database") {
      return (
        <Panel title="KEHE">
          <p className="text-sm text-muted">The database is not connected.</p>
        </Panel>
      );
    }
    if (report.state === "error") {
      return (
        <Panel title="KEHE">
          <p className="text-sm text-hibiscus">{report.message}</p>
        </Panel>
      );
    }
    return <KeheView report={report} period={period} region={query.region} />;
  }

  if (query.channel === "dsd") {
    const report = await loadDsdOverview(query.region, period, partner);
    const options =
      report.state === "ready" ? report.knownPartners : DSD_PARTNERS.map((item) => ({ slug: item.slug, label: item.label }));
    return (
      <>
        <DsdPartnerFilter query={query} options={options} />
        {report.state === "no-database" ? (
          <Panel title="DSD">
            <p className="text-sm text-muted">The database is not connected.</p>
          </Panel>
        ) : null}
        {report.state === "error" ? (
          <Panel title="DSD">
            <p className="text-sm text-hibiscus">{report.message}</p>
          </Panel>
        ) : null}
        {report.state === "ready" ? (
          <DsdView report={report} period={period} region={query.region} partner={partner} />
        ) : null}
      </>
    );
  }

  const report = await loadUnfiOverview(query.region, period);
  if (report.state === "no-database") {
    return (
      <Panel title="UNFI">
        <p className="text-sm text-muted">The database is not connected.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="UNFI">
        <p className="text-sm text-hibiscus">{report.message}</p>
      </Panel>
    );
  }
  return <UnfiView report={report} period={period} region={query.region} />;
}

export { compareLabel };

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