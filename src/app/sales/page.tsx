import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SourceRevenue } from "@/components/source-revenue";
import { accountCounts, listAccounts } from "@/lib/sources/accounts";
import { revenueByOrderingMethod, type RevenueReport } from "@/lib/sources/revenue";

export const metadata: Metadata = { title: "Sales Overview" };

export default function SalesOverviewPage() {
  return (
    <>
      <PageHeader
        title="Sales Overview"
        description="One view of wholesale revenue. A sale lands in the period of its ship date. Direct totals leave out orders tagged for a distributor."
      />
      <Suspense fallback={<KpiFallback />}>
        <SalesKpis />
      </Suspense>
      <div className="mt-4">
        <Suspense fallback={<Panel title="By ordering method">Loading synced orders.</Panel>}>
          <SalesRevenue />
        </Suspense>
      </div>
      <div className="mt-4">
        <Suspense fallback={<Panel title="Account health">Loading HubSpot accounts.</Panel>}>
          <SalesAccounts />
        </Suspense>
      </div>
    </>
  );
}

async function SalesKpis() {
  await connection();
  const revenue = await revenueByOrderingMethod();
  const cards = kpiCards(revenue);
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}

async function SalesRevenue() {
  await connection();
  const revenue = await revenueByOrderingMethod();
  return <SourceRevenue report={revenue} />;
}

async function SalesAccounts() {
  await connection();
  const [counts, list] = await Promise.all([
    accountCounts("hubspot"),
    listAccounts({ source: "hubspot", limit: 50 }),
  ]);
  const total = counts.state === "ready" ? counts.total : list.state === "ready" ? list.total : 0;
  const showing = list.state === "ready" ? list.rows.length : 0;

  return (
    <Panel title="Account health" action={total ? `${showing} of ${total} · HubSpot` : "HubSpot"}>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Active, At Risk, and Past need a last ship date from orders. Until Shopify or KEHE lands those
        orders, this list shows the HubSpot company type.
      </p>
      {counts.state === "error" || list.state === "error" ? (
        <p className="text-sm text-hibiscus">
          {counts.state === "error" ? counts.message : list.state === "error" ? list.message : ""}
        </p>
      ) : null}
      {list.state === "no-database" || counts.state === "no-database" ? (
        <p className="text-sm text-muted">The database is not connected.</p>
      ) : null}
      {list.state === "empty" ? (
        <p className="text-sm text-muted">
          No HubSpot companies yet.{" "}
          <Link href="/sources" className="font-semibold text-heading underline">
            Open Sources
          </Link>{" "}
          and sync HubSpot.
        </p>
      ) : null}
      {list.state === "ready" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Account</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Last ship</th>
                <th className="pb-3 font-medium">Region</th>
                <th className="pb-3 font-medium">Method</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((account) => (
                <tr key={`${account.source}-${account.name}`} className="border-t border-line">
                  <td className="py-3 font-medium">{account.name}</td>
                  <td className="py-3">{account.customerType ?? "—"}</td>
                  <td className="py-3 text-muted">—</td>
                  <td className="py-3">{account.region ?? "—"}</td>
                  <td className="py-3">{account.orderingMethod ?? account.industryType ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}

function kpiCards(revenue: RevenueReport) {
  const methods = ["Direct", "DSD", "KEHE", "UNFI"] as const;
  if (revenue.state !== "ready") {
    return methods.map((label) => ({
      label,
      value: "—",
      delta: "No orders synced yet",
      tone: "flat" as const,
    }));
  }
  return methods.map((label) => {
    const rows =
      label === "Direct"
        ? revenue.rows.filter((row) => row.orderingMethod === "Direct" && row.direction === "direct")
        : revenue.rows.filter((row) => row.orderingMethod === label);
    const amount = rows.reduce((sum, row) => sum + row.revenue, 0);
    return {
      label,
      value: dollars(amount),
      delta: rows.length ? `${rows.reduce((sum, row) => sum + row.orders, 0).toLocaleString()} orders` : "No orders synced yet",
      tone: "flat" as const,
    };
  });
}

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value,
  );
}

function KpiFallback() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {["Direct", "DSD", "KEHE", "UNFI"].map((label) => (
        <KpiCard key={label} label={label} value="—" delta="Loading" tone="flat" />
      ))}
    </div>
  );
}
