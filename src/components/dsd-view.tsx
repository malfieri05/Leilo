import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { ScrollRegion } from "@/components/scroll-region";
import { SalesToThroughPanel } from "@/components/sales-to-through-panel";
import { DSD_PARTNERS } from "@/lib/sources/dsd/partners";
import type { DsdOverview } from "@/lib/sources/dsd-overview";
import type { RegionKey, ResolvedPeriod } from "@/lib/sources/sales-overview-model";

export function DsdView({
  report,
  period,
  region,
  partner,
}: {
  report: Extract<DsdOverview, { state: "ready" }>;
  period: ResolvedPeriod;
  region: RegionKey;
  partner: string | null;
}) {
  const families = report.families.filter((family) => family.family !== "Unmapped" || family.revenue > 0);
  const hasSales = report.revenue > 0 || report.distributors.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {hasSales ? "Reports already in ARK are included below." : "No partner reports are stored yet."}{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sync DSD partners on Sources
        </Link>
        {" "}
        or upload a CSV per partner. Industry Type comes from a same-name HubSpot company.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="DSD Total Revenue"
          value={money(report.revenue)}
          delta={priorDelta(report.revenue, report.priorRevenue)}
          tone={tone(report.revenue, report.priorRevenue)}
        />
        <KpiCard label="DSD SKUs Carried" value={count(report.skusCarried)} delta="Distinct SKUs shipped" tone="flat" />
        <KpiCard label="DSD Total PODs" value={count(report.pods)} delta="Retailer × SKU" tone="flat" />
      </div>

      <SalesToThroughPanel
        rows={[report.distributorFlow]}
        period={period}
        region={region}
        channelLabel="DSD"
      />

      <Panel title="DSD Revenue by Distributor" action={partner ? "One partner" : period.label}>
        {report.distributors.length === 0 ? (
          <p className="text-sm text-muted">No through-partner revenue in this period.</p>
        ) : (
          <ScrollRegion>
            <ul className="divide-y divide-line text-sm">
            {report.distributors.map((row) => (
              <li key={row.slug} className="flex items-baseline justify-between gap-3 py-2">
                <span className="font-medium">{row.label}</span>
                <span className="text-muted">
                  {money(row.revenue)}
                  {row.syncedAt ? ` · last file ${when(row.syncedAt)}` : ""}
                </span>
              </li>
            ))}
            </ul>
          </ScrollRegion>
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="DSD Revenue by SKU" action={period.label}>
          {report.skus.length === 0 ? (
            <Empty />
          ) : (
            <ScrollRegion>
              <SkuTable rows={report.skus} pods />
            </ScrollRegion>
          )}
        </Panel>
        <Panel title="DSD Revenue by Product Type" action={period.label}>
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

      <Panel title="DSD Revenue by Industry Type" action={period.label}>
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

      <Panel title="DSD PODs by SKU" action={period.label}>
        {report.skus.length === 0 ? (
          <Empty />
        ) : (
          <ScrollRegion>
            <SkuTable rows={report.skus} pods />
          </ScrollRegion>
        )}
      </Panel>

      <Panel title="How reports arrive" action="Upload on Sources">
        <ScrollRegion tall>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Partner</th>
                <th className="pb-3 font-medium">Intake</th>
                <th className="pb-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {DSD_PARTNERS.map((item) => (
                <tr key={item.slug} className="border-t border-line">
                  <td className="py-2 font-medium">{item.label}</td>
                  <td className="py-2">{item.intake}</td>
                  <td className="py-2 text-muted">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="HubSpot write-back" action="Later">
          <p className="text-sm text-muted">
            Uploads stay in ARK for now. A later step will push retailer name, address, Industry Type, and the order
            (date, SKUs, revenue) into HubSpot.
          </p>
        </Panel>
        <Panel title="Case math" action="When the file has units only">
          <ul className="space-y-2 text-sm">
            <li>Can · $2.99</li>
            <li>Stick · $1.50</li>
            <li>Single-can case · 12 cans</li>
            <li>4-pack case · 24 cans</li>
          </ul>
        </Panel>
      </div>
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
  return <p className="text-sm text-muted">No DSD sales through to retailers in this period.</p>;
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
  if (!value) return "";
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
