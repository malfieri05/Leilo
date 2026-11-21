import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { coverageKey, type SpinsComparisonRow, type SpinsOverview, type SpinsTableRow } from "@/lib/sources/spins-overview";
import {
  reportLabel,
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  type SpinsQuery,
  type SpinsReportKind,
} from "@/lib/sources/spins-model";

export function SpinsView({
  report,
  query,
  apiConfigured,
}: {
  report: Extract<SpinsOverview, { state: "ready" }>;
  query: SpinsQuery;
  apiConfigured: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Each monthly release is Brand Rank, Item Rank, and the Sprouts item matrix, each in 4-, 12-, 24-, and 52-week
        windows. Upload those extracts on{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        . {apiConfigured ? "The Data Access API credentials are set." : "The Data Access API is not configured, so this tab reads files."}{" "}
        {report.release?.syncedAt ? `This ${reportLabel(query.report)} ${query.weeks}-week file was stored ${when(report.release.syncedAt)}.` : "No file is stored for this report and window yet."}
      </p>

      <Panel title="Release coverage" action="12 extracts">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-2 font-medium">Report</th>
                {SPINS_PERIOD_WEEKS.map((weeks) => (
                  <th key={weeks} className="py-2 text-center font-medium">
                    {weeks}w
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPINS_REPORT_KINDS.map((kind) => (
                <tr key={kind} className="border-t border-line">
                  <td className="py-2 text-heading">{reportLabel(kind)}</td>
                  {SPINS_PERIOD_WEEKS.map((weeks) => (
                    <td key={weeks} className="py-2 text-center text-heading">
                      {report.coverage[coverageKey(kind, weeks)] ? "Yes" : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="In-view dollars" value={money(report.summary.inViewDollars)} delta={`${count(report.summary.inViewUnits)} units`} tone="flat" />
        <KpiCard label="Leilo dollars" value={money(report.summary.leiloDollars)} delta={reportLabel(query.report)} tone="flat" />
        <KpiCard label="Competitor-set dollars" value={money(report.summary.competitorDollars)} delta="Listed brands only" tone="flat" />
        <KpiCard label="Rows held out" value={count(report.summary.heldOut)} delta="4-packs and under $2,000" tone="flat" />
      </div>

      {report.regionNote ? <p className="text-sm text-muted">{report.regionNote}</p> : null}

      <Panel title="Competitor comparison" action={`${query.weeks} weeks`}>
        <ComparisonTable rows={report.comparison} />
      </Panel>

      <Panel title={tableTitle(query.report)} action={query.scope === "all" ? "All brands in view" : "Leilo and competitors"}>
        <DataTable reportKind={query.report} rows={report.rows} />
      </Panel>

      <Panel title="Held out of SPINS" action="By rule">
        <p className="text-sm text-muted">
          Leilo 4-packs stay out of these views. So does any item whose dollar sales are under $2,000. The held-out
          count is from the latest file for this report and window.
        </p>
      </Panel>
    </div>
  );
}

function ComparisonTable({ rows }: { rows: SpinsComparisonRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Upload a report to compare brands.</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-[0.14em] text-muted">
        <tr>
          <th className="py-2 font-medium">Brand</th>
          <th className="py-2 text-right font-medium">Dollars</th>
          <th className="py-2 text-right font-medium">Units</th>
          <th className="py-2 text-right font-medium">Rank</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.brand} className="border-t border-line">
            <td className="py-2 text-heading">{row.brand}</td>
            <td className="py-2 text-right tabular-nums text-heading">{money(row.dollars)}</td>
            <td className="py-2 text-right tabular-nums text-muted">{count(row.units)}</td>
            <td className="py-2 text-right tabular-nums text-muted">{row.rank ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DataTable({ reportKind, rows }: { reportKind: SpinsReportKind; rows: SpinsTableRow[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Nothing in view for this report, window, and region.</p>;
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs uppercase tracking-[0.14em] text-muted">
        <tr>
          {reportKind !== "brand-rank" ? <th className="py-2 font-medium">Item</th> : null}
          <th className="py-2 font-medium">Brand</th>
          {reportKind === "sprouts-matrix" ? <th className="py-2 font-medium">Retailer</th> : null}
          <th className="py-2 text-right font-medium">Dollars</th>
          <th className="py-2 text-right font-medium">Units</th>
          <th className="py-2 text-right font-medium">Rank</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={`${row.brand}-${row.itemLabel}-${row.retailer}-${index}`} className="border-t border-line">
            {reportKind !== "brand-rank" ? <td className="py-2 text-heading">{row.itemLabel || "—"}</td> : null}
            <td className="py-2 text-heading">{row.brand || "—"}</td>
            {reportKind === "sprouts-matrix" ? <td className="py-2 text-muted">{row.retailer || "—"}</td> : null}
            <td className="py-2 text-right tabular-nums text-heading">{money(row.dollars)}</td>
            <td className="py-2 text-right tabular-nums text-muted">{count(row.units)}</td>
            <td className="py-2 text-right tabular-nums text-muted">{row.rank ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function tableTitle(report: SpinsReportKind) {
  return reportLabel(report);
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function count(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
