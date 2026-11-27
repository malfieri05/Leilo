import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { ScrollRegion } from "@/components/scroll-region";
import type { DirectOverview } from "@/lib/sources/direct-overview";
import type { ResolvedPeriod } from "@/lib/sources/sales-overview-model";

export function DirectView({
  report,
  period,
}: {
  report: Extract<DirectOverview, { state: "ready" }>;
  period: ResolvedPeriod;
}) {
  const families = report.families.filter((family) => family.family !== "Unmapped" || family.revenue > 0);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Shopify synced {when(report.shopifySyncedAt)}. HubSpot companies synced {when(report.hubspotSyncedAt)}.{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        . Industry Type comes from a same-name HubSpot company. Writing account quality back to HubSpot comes later.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Direct Total Revenue"
          value={money(report.revenue)}
          delta={priorDelta(report.revenue, report.priorRevenue)}
          tone={tone(report.revenue, report.priorRevenue)}
        />
        <KpiCard label="Direct SKUs Carried" value={count(report.skusCarried)} delta="Distinct SKUs shipped" tone="flat" />
        <KpiCard label="Direct Total PODs" value={count(report.pods)} delta="Account × SKU" tone="flat" />
        <KpiCard label="Direct accounts, 30 days" value={count(report.active30)} delta="As of today" tone="flat" />
        <KpiCard label="Direct accounts, 60 days" value={count(report.active60)} delta="As of today" tone="flat" />
        <KpiCard label="Direct accounts, 90 days" value={count(report.active90)} delta="As of today" tone="flat" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Direct Revenue by SKU" action={period.label}>
          {report.skus.length === 0 ? (
            <Empty />
          ) : (
            <ScrollRegion>
              <SkuTable rows={report.skus} pods />
            </ScrollRegion>
          )}
        </Panel>
        <Panel title="Direct Revenue by Product Type" action={period.label}>
          {families.every((family) => family.revenue === 0) ? (
            <Empty />
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

      <Panel title="Direct Revenue by Industry Type" action={period.label}>
        {report.industry.length === 0 ? (
          <Empty />
        ) : (
          <ScrollRegion tall>
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Accounts</th>
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

      <Panel title="Direct PODs by SKU" action={period.label}>
        {report.skus.length === 0 ? (
          <Empty />
        ) : (
          <ScrollRegion>
            <SkuTable rows={report.skus} pods />
          </ScrollRegion>
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

function Empty() {
  return <p className="text-sm text-muted">No Direct wholesale orders in this period.</p>;
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

function when(value: string | null) {
  if (!value) return "not yet";
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
