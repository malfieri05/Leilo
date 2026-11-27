import Link from "next/link";
import { Panel } from "@/components/panel";
import { ScrollRegion } from "@/components/scroll-region";
import type { DistributorFlowRow } from "@/lib/sources/sales-to-through";
import { salesQueryString, type RegionKey, type ResolvedPeriod, type SalesQuery } from "@/lib/sources/sales-overview-model";

export function SalesToThroughPanel({
  rows,
  period,
  region,
  channelLabel,
  query,
}: {
  rows: DistributorFlowRow[];
  period: ResolvedPeriod;
  region: RegionKey;
  /** When set, renders a single-channel summary (no channel links column). */
  channelLabel?: string;
  query?: SalesQuery;
}) {
  const single = channelLabel != null;
  const title = single ? `${channelLabel} sales to vs sales through` : "Sales to vs sales through";

  return (
    <Panel title={title} action={period.label}>
      <p className="mb-4 text-sm text-muted">
        Sales to is Leilo&apos;s Shopify invoice to the distributor. Sales through is that distributor&apos;s report to
        stores.
        {single ? " Revenue on this tab is sales through unless noted below." : " These amounts stay separate from total revenue above."}
      </p>
      {region !== "nationwide" ? (
        <p className="mb-4 text-sm text-muted">
          Sales to is nationwide only (warehouse invoices are not split by retailer state). Sales through respects the{" "}
          {region === "california" ? "California" : "Southeast"} filter.
        </p>
      ) : null}
      {single && rows[0] ? (
        <SingleFlow row={rows[0]} period={period} region={region} />
      ) : (
        <ScrollRegion compact>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Channel</th>
                <th className="pb-3 font-medium">Sales to</th>
                <th className="pb-3 font-medium">Sales through</th>
                <th className="pb-3 font-medium">Retailers (through)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.channel} className="border-t border-line align-top">
                  <td className="py-3 font-medium">
                    {query ? (
                      <Link
                        href={`/sales${salesQueryString(query, { channel: row.channel.toLowerCase() as SalesQuery["channel"] })}`}
                        className="text-heading underline-offset-2 hover:underline"
                      >
                        {row.channel}
                      </Link>
                    ) : (
                      row.channel
                    )}
                  </td>
                  <ToCell row={row} period={period} region={region} />
                  <td className="py-3">
                    <p className="font-medium">{money(row.salesThrough.revenue)}</p>
                    <PriorCompare
                      current={row.salesThrough.revenue}
                      prior={row.salesThrough.priorRevenue}
                      period={period}
                      className="mt-0.5 text-xs"
                    />
                  </td>
                  <td className="py-3 text-muted">
                    {row.salesThrough.retailers > 0 ? row.salesThrough.retailers.toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollRegion>
      )}
    </Panel>
  );
}

function SingleFlow({ row, period, region }: { row: DistributorFlowRow; period: ResolvedPeriod; region: RegionKey }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FlowCard
        label="Sales to"
        row={row}
        period={period}
        region={region}
        kind="to"
      />
      <FlowCard
        label="Sales through"
        row={row}
        period={period}
        region={region}
        kind="through"
      />
    </div>
  );
}

function FlowCard({
  label,
  row,
  period,
  region,
  kind,
}: {
  label: string;
  row: DistributorFlowRow;
  period: ResolvedPeriod;
  region: RegionKey;
  kind: "to" | "through";
}) {
  const revenue = kind === "to" ? row.salesTo.revenue : row.salesThrough.revenue;
  const prior = kind === "to" ? row.salesTo.priorRevenue : row.salesThrough.priorRevenue;
  const detail =
    kind === "to"
      ? row.salesTo.orders > 0
        ? `${row.salesTo.orders.toLocaleString()} invoice${row.salesTo.orders === 1 ? "" : "s"}`
        : region !== "nationwide"
          ? "Not split by retailer state"
          : "No invoices in this period"
      : row.salesThrough.retailers > 0
        ? `${row.salesThrough.retailers.toLocaleString()} retailer${row.salesThrough.retailers === 1 ? "" : "s"}`
        : "No retailer sales in this period";

  return (
    <div className="rounded-[10px] border border-line bg-paper px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-heading sm:text-3xl">{money(revenue)}</p>
      <PriorCompare current={revenue} prior={prior} period={period} className="mt-2 text-sm" />
      <p className="mt-2 text-sm text-muted">{detail}</p>
    </div>
  );
}

function ToCell({ row, period, region }: { row: DistributorFlowRow; period: ResolvedPeriod; region: RegionKey }) {
  return (
    <td className="py-3">
      <p className="font-medium">{money(row.salesTo.revenue)}</p>
      <PriorCompare current={row.salesTo.revenue} prior={row.salesTo.priorRevenue} period={period} className="mt-0.5 text-xs" />
      <p className="mt-1 text-xs text-muted">
        {row.salesTo.orders > 0
          ? `${row.salesTo.orders.toLocaleString()} invoice${row.salesTo.orders === 1 ? "" : "s"}`
          : region !== "nationwide"
            ? "Not split by retailer state"
            : "No invoices in this period"}
      </p>
    </td>
  );
}

function PriorCompare({
  current,
  prior,
  period,
  className,
}: {
  current: number;
  prior: number | null;
  period: ResolvedPeriod;
  className?: string;
}) {
  if (prior == null || !period.from) return null;
  const label = priorDelta(current, prior);
  const tone = deltaTone(current, prior);
  const toneClass = tone === "up" ? "text-[#2f6b4f]" : tone === "down" ? "text-hibiscus" : "text-muted";
  return <p className={`${className ?? ""} ${toneClass}`.trim()}>{label}</p>;
}

function priorDelta(current: number, prior: number) {
  if (prior === 0) return "No prior-year revenue";
  const change = Math.round(((current - prior) / prior) * 100);
  const sign = change > 0 ? "+" : "";
  return `${sign}${change}% vs last year (${money(prior)})`;
}

function deltaTone(current: number, prior: number | null): "up" | "down" | "flat" {
  if (prior == null || prior === 0 || current === prior) return "flat";
  return current > prior ? "up" : "down";
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}