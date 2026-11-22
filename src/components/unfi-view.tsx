import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import type { UnfiOverview } from "@/lib/sources/unfi-overview";
import type { ResolvedPeriod } from "@/lib/sources/sales-overview-model";

const SKU_PREVIEW = 8;

export function UnfiView({ report, period }: { report: Extract<UnfiOverview, { state: "ready" }>; period: ResolvedPeriod }) {
  const preview = report.skus.slice(0, SKU_PREVIEW);
  const rest = report.skus.slice(SKU_PREVIEW);
  const families = report.families.filter((family) => family.family !== "Unmapped" || family.revenue > 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Last sales file {when(report.salesSyncedAt)}.{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Upload on Sources
        </Link>
        . Choose sales-through for UNFI’s sales to retailers.
        {fileNote(report.latestShip, period.to)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="UNFI Total Locations" value={count(report.locations)} delta={period.label} tone="flat" />
        <KpiCard
          label="UNFI Total Revenue"
          value={money(report.revenue)}
          delta={priorDelta(report.revenue, report.priorRevenue)}
          tone={tone(report.revenue, report.priorRevenue)}
        />
        <KpiCard label="UNFI SKUs Carried" value={count(report.skusCarried)} delta="Distinct SKUs shipped" tone="flat" />
        <KpiCard label="UNFI Total PODs" value={count(report.pods)} delta="Retailer × SKU" tone="flat" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="UNFI Revenue by SKU" action={period.label}>
          {report.skus.length === 0 ? (
            <EmptySales />
          ) : (
            <>
              <SkuTable rows={preview} />
              {rest.length > 0 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-heading">Other SKUs ({rest.length})</summary>
                  <div className="mt-3">
                    <SkuTable rows={rest} />
                  </div>
                </details>
              ) : null}
            </>
          )}
        </Panel>
        <Panel title="UNFI Revenue by Product Type" action={period.label}>
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

      <Panel title="UNFI PODs by SKU" action={period.label}>
        {report.skus.length === 0 ? <EmptySales /> : <SkuTable rows={report.skus.slice(0, 12)} pods />}
      </Panel>

      <Panel title="UNFI Revenue by Industry Type" action={period.label}>
        {report.industry.length === 0 ? (
          <EmptySales />
        ) : (
          <div className="overflow-x-auto">
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
          </div>
        )}
      </Panel>
    </div>
  );
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

function EmptySales() {
  return (
    <p className="text-sm text-muted">
      No UNFI sales through to retailers in this period. Upload a sales-through file on Sources.
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
