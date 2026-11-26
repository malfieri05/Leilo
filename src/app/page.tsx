import { Suspense } from "react";
import { connection } from "next/server";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { SourceRevenue } from "@/components/source-revenue";
import { accounts, flavorMix, kpis, weeklyTrend } from "@/lib/mock-data";
import { revenueByOrderingMethod } from "@/lib/sources/revenue";

export default function OverviewPage() {
  const maxTrend = Math.max(...weeklyTrend);

  return (
    <>
      <Suspense fallback={<Panel title="Revenue by ordering method">Loading source revenue.</Panel>}>
        <OverviewRevenue />
      </Suspense>

      <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Sample data
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Panel title="Weekly case volume" action="Last 12 weeks">
            <div className="flex h-44 items-end gap-2">
              {weeklyTrend.map((point, index) => (
                <div
                  key={`${point}-${index}`}
                  className="flex-1 rounded-t-md bg-lagoon/80"
                  style={{ height: `${(point / maxTrend) * 100}%` }}
                  title={`${point}k cases`}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">
              Chart placeholder. Swap for a real series once Shopify / distributor feeds land.
            </p>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Flavor mix" action="MTD share">
            <ul className="space-y-3">
              {flavorMix.map((flavor) => (
                <li key={flavor.name}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{flavor.name}</span>
                    <span className="text-muted">{flavor.share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-foam">
                    <div
                      className={`h-full rounded-full ${flavor.color}`}
                      style={{ width: `${flavor.share * 3.2}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Priority accounts" action="Placeholder roster">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="pb-3 font-medium">Account</th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Cases MTD</th>
                  <th className="pb-3 font-medium">Owner</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.name} className="border-t border-line">
                    <td className="py-3 font-medium">{account.name}</td>
                    <td className="py-3 text-muted">{account.type}</td>
                    <td className="py-3">{account.status}</td>
                    <td className="py-3">{account.cases.toLocaleString()}</td>
                    <td className="py-3 text-muted">{account.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}

async function OverviewRevenue() {
  await connection();
  const revenue = await revenueByOrderingMethod();
  return <SourceRevenue report={revenue} />;
}
