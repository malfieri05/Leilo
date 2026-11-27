import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { ScrollRegion } from "@/components/scroll-region";
import { SalesToThroughPanel } from "@/components/sales-to-through-panel";
import type { KeheOverview, KeheStockCell } from "@/lib/sources/kehe-overview";
import type { RegionKey, ResolvedPeriod } from "@/lib/sources/sales-overview-model";
import type { StockFlag } from "@/lib/sources/kehe-stock-flags";

export function KeheView({
  report,
  period,
  region,
}: {
  report: Extract<KeheOverview, { state: "ready" }>;
  period: ResolvedPeriod;
  region: RegionKey;
}) {
  const families = report.families.filter((family) => family.family !== "Unmapped" || family.revenue > 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Last sales file {when(report.salesSyncedAt)}. Last stock file {when(report.stockSyncedAt)}.{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Upload on Sources
        </Link>
        . Choose Chains and Stores for sales, or Stock Status for the DC chart.
        {fileNote(report.latestShip, period.to)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="KEHE Total Locations" value={count(report.locations)} delta={period.label} tone="flat" />
        <KpiCard
          label="KEHE Total Revenue"
          value={money(report.revenue)}
          delta={priorDelta(report.revenue, report.priorRevenue)}
          tone={tone(report.revenue, report.priorRevenue)}
        />
        <KpiCard label="KEHE SKUs Carried" value={count(report.skusCarried)} delta="Distinct SKUs shipped" tone="flat" />
        <KpiCard label="KEHE Total PODs" value={count(report.pods)} delta="Retailer × SKU" tone="flat" />
        <KpiCard
          label="KEHE Fill Rate"
          value={report.fillRate === null ? "—" : percent(report.fillRate)}
          delta={
            report.casesOrdered > 0
              ? `${formatQty(report.casesShipped)} shipped / ${formatQty(report.casesOrdered)} ordered`
              : "Cases ordered were not in this file"
          }
          tone="flat"
        />
      </div>

      <SalesToThroughPanel
        rows={[report.distributorFlow]}
        period={period}
        region={region}
        channelLabel="KEHE"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="KEHE Revenue by SKU" action={period.label}>
          {report.skus.length === 0 ? (
            <EmptySales />
          ) : (
            <ScrollRegion>
              <SkuTable rows={report.skus} />
            </ScrollRegion>
          )}
        </Panel>
        <Panel title="KEHE Revenue by Product Type" action={period.label}>
          {families.every((family) => family.revenue === 0) ? (
            <EmptySales />
          ) : (
            <ul className="divide-y divide-line">
              {families.map((family) => (
                <li key={family.family} className="flex items-baseline justify-between gap-3 py-3 text-sm">
                  <span className="font-medium">{family.family}</span>
                  <span className="text-muted">{family.revenue > 0 ? money(family.revenue) : "No revenue in this period"}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="KEHE PODs by SKU" action={period.label}>
        {report.skus.length === 0 ? (
          <EmptySales />
        ) : (
          <ScrollRegion>
            <SkuTable rows={report.skus} pods />
          </ScrollRegion>
        )}
      </Panel>

      <Panel title="KEHE Revenue by Industry Type" action={period.label}>
        {report.industry.length === 0 ? (
          <EmptySales />
        ) : (
          <ScrollRegion tall>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Locations</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {report.industry.map((row) => (
                  <tr key={row.type} className="border-t border-line">
                    <td className="py-3 font-medium">{row.type}</td>
                    <td className="py-3">{count(row.accounts)}</td>
                    <td className="py-3">{money(row.revenue)}</td>
                    <td className="py-3">{percent(row.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollRegion>
        )}
      </Panel>

      <Panel title="KEHE Fill Rate" action={period.label}>
        {report.shortShips.length === 0 ? (
          <p className="text-sm text-muted">
            {report.casesOrdered > 0
              ? "No retailer shipped fewer cases than were ordered in this period."
              : "Upload Chains and Stores with cases ordered and cases shipped to see short ships."}
          </p>
        ) : (
          <ScrollRegion>
            <ul className="divide-y divide-line text-sm">
            {report.shortShips.map((row) => (
              <li key={row.name} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-medium">{row.name}</span>
                <span className="text-muted">
                  {formatQty(row.shipped)} / {formatQty(row.ordered)} · {percent(row.fill)}
                </span>
              </li>
            ))}
            </ul>
          </ScrollRegion>
        )}
      </Panel>

      <Panel title="KEHE DC stock status" action={report.stockSyncedAt ? "Latest pull" : "No pull yet"}>
        {report.warnings.length > 0 ? (
          <ul className="mb-4 space-y-1 text-sm text-hibiscus">
            {report.warnings.map((warning) => (
              <li key={warning.code}>{warning.message}</li>
            ))}
          </ul>
        ) : null}
        {report.stock.length === 0 && report.nearMisses.length === 0 ? (
          <p className="text-sm text-muted">
            No stock snapshot yet. On Sources, import a Stock Status CSV and choose Stock Status Report.
          </p>
        ) : (
          <>
            <StockLegend />
            <StockGrid cells={report.stock} />
            {report.nearMisses.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-semibold text-heading">Near misses ({report.nearMisses.length})</p>
                <p className="mt-1 text-sm text-muted">
                  These SKUs meet the sales-order test, but neither weeks figure is above 8, so they are not green.
                </p>
                <ScrollRegion className="mt-2">
                  <ul className="divide-y divide-line text-sm">
                    {report.nearMisses.map((cell) => (
                      <li key={`${cell.dcCode}-${cell.upc}`} className="py-2">
                        {cell.dcName} · {cell.description || cell.upc}
                      </li>
                    ))}
                  </ul>
                </ScrollRegion>
              </div>
            ) : null}
          </>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="New KEHE retailers" action={period.label}>
          {report.newAccounts.length === 0 ? (
            <p className="text-sm text-muted">No first-time KEHE retailers in this period.</p>
          ) : (
            <NameList names={report.newAccounts.map((account) => account.name)} />
          )}
        </Panel>
        <Panel title="KEHE account health" action="As of today">
          <ul className="space-y-2 text-sm">
            <li>Active · {count(report.health.active)} · last order within 90 days</li>
            <li>At Risk · {count(report.health.atRisk)} · 90 to 150 days</li>
            <li>Past · {count(report.health.past)} · more than 150 days</li>
            <li>Lifetime · {count(report.health.lifetime)}</li>
          </ul>
        </Panel>
        <Panel title="KEHE upsell gaps" action="Cans and mixes">
          {report.upsells.length === 0 ? (
            <p className="text-sm text-muted">
              No active KEHE retailer is missing a can or drink-mix SKU from the history already in ARK. Flakes and extract stay off this list.
            </p>
          ) : (
            <ul className="space-y-3 text-sm">
              {report.upsells.map((row) => (
                <li key={row.name}>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-muted">{row.missing.join(", ")}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StockGrid({ cells }: { cells: KeheStockCell[] }) {
  const flagged = cells.filter((cell) => cell.flag !== "none");
  const upcs = [...new Set(flagged.map((cell) => cell.upc))].slice(0, 16);
  const dcs = [...new Map(flagged.map((cell) => [cell.dcCode, cell.dcName])).entries()];
  if (upcs.length === 0) return <p className="text-sm text-muted">No flagged DC and SKU pairs in the latest pull.</p>;
  const lookup = new Map(flagged.map((cell) => [`${cell.dcCode}|${cell.upc}`, cell]));
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-xs">
        <thead>
          <tr>
            <th className="pb-2 pr-3 font-medium text-muted">DC</th>
            {upcs.map((upc) => (
              <th key={upc} className="pb-2 px-1 font-medium text-muted">
                {upc}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dcs.map(([code, name]) => (
            <tr key={code}>
              <th className="py-1 pr-3 text-left font-medium">{name}</th>
              {upcs.map((upc) => {
                const cell = lookup.get(`${code}|${upc}`);
                return (
                  <td key={upc} className="px-1 py-1">
                    {cell ? (
                      <span
                        title={`${cell.description ?? upc}: ${cell.qtyOnHand} on hand, ${cell.combinedWeeks} weeks. ${cell.note ?? ""}`}
                        className={`inline-flex min-w-10 justify-center rounded px-1.5 py-1 font-semibold ${flagClass(cell.flag)}`}
                      >
                        {cell.combinedWeeks}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StockLegend() {
  const items: { flag: StockFlag; label: string }[] = [
    { flag: "red", label: "Under 3 weeks" },
    { flag: "orange", label: "Under 5" },
    { flag: "yellow", label: "Under 7" },
    { flag: "green", label: "Heavy demand" },
  ];
  return (
    <ul className="mb-4 flex flex-wrap gap-3 text-xs">
      {items.map((item) => (
        <li key={item.flag} className="flex items-center gap-2">
          <span className={`inline-block h-3 w-3 rounded-sm ${flagClass(item.flag)}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

function flagClass(flag: StockFlag) {
  if (flag === "red") return "bg-[#b42318] text-white";
  if (flag === "orange") return "bg-[#f5c061] text-heading";
  if (flag === "yellow") return "bg-[#f4eeda] text-heading";
  if (flag === "green") return "bg-[#2f6b4f] text-white";
  return "bg-line text-muted";
}

function SkuTable({ rows, pods = false }: { rows: { sku: string; revenue: number; pods: number }[]; pods?: boolean }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-[0.12em] text-muted">
        <tr>
          <th className="pb-3 font-medium">SKU</th>
          <th className="pb-3 font-medium">{pods ? "PODs" : "Revenue"}</th>
          {pods ? <th className="pb-3 font-medium">Revenue</th> : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.sku} className="border-t border-line">
            <td className="py-2 font-medium">{row.sku}</td>
            <td className="py-2">{pods ? count(row.pods) : money(row.revenue)}</td>
            {pods ? <td className="py-2 text-muted">{money(row.revenue)}</td> : null}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function NameList({ names }: { names: string[] }) {
  return (
    <ul className="max-h-64 divide-y divide-line overflow-y-auto text-sm">
      {names.map((name) => (
        <li key={name} className="py-2">
          {name}
        </li>
      ))}
    </ul>
  );
}

function EmptySales() {
  return (
    <p className="text-sm text-muted">
      No KEHE sales through to retailers in this period. Upload Chains and Stores on Sources.
    </p>
  );
}

function priorDelta(current: number, prior: number | null) {
  if (prior == null) return "All time";
  if (prior === 0) return "No prior-year revenue";
  const change = Math.round(((current - prior) / prior) * 100);
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}% vs last year (${money(prior)})`;
}

function tone(current: number, prior: number | null): "up" | "down" | "flat" {
  if (prior == null || prior === 0 || current === prior) return "flat";
  return current > prior ? "up" : "down";
}

function fileNote(latestShip: string | null, periodTo: string | null) {
  if (!latestShip || !periodTo || latestShip >= periodTo) return null;
  const label = new Date(`${latestShip.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  return ` The sales file runs through ${label}, so later dates in this period are empty.`;
}

function when(value: string | null) {
  if (!value) return "not imported";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function count(value: number) {
  return value.toLocaleString();
}

function formatQty(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
