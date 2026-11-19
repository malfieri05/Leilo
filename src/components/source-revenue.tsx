import Link from "next/link";
import { Panel } from "@/components/panel";
import type { RevenueReport } from "@/lib/sources/revenue";

export function SourceRevenue({ report }: { report: RevenueReport }) {
  return (
    <Panel title="Revenue by ordering method" action="Ship date">
      {report.state === "no-database" ? (
        <p className="text-sm text-muted">
          The database is not connected, so this total is empty. Sample figures below stay labeled.
        </p>
      ) : null}
      {report.state === "error" ? (
        <p className="text-sm text-hibiscus">{report.message}</p>
      ) : null}
      {report.state === "empty" ? (
        <p className="text-sm text-muted">
          No synced orders yet.{" "}
          <Link href="/sources" className="font-semibold text-heading underline">
            Open Sources
          </Link>{" "}
          to sync an API or upload a file. Sample figures below stay labeled until a source has data.
        </p>
      ) : null}
      {report.state === "ready" ? (
        <>
          <p className="mb-4 text-sm text-muted">
            {dollars(report.total)} across synced orders. Direct, excluding sales to a distributor, is{" "}
            {dollars(report.direct)}.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="pb-3 font-medium">Ordering method</th>
                  <th className="pb-3 font-medium">Direction</th>
                  <th className="pb-3 font-medium">Orders</th>
                  <th className="pb-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={`${row.orderingMethod}-${row.direction}`} className="border-t border-line">
                    <td className="py-3 font-medium">{row.orderingMethod}</td>
                    <td className="py-3 text-muted">{row.directionLabel}</td>
                    <td className="py-3">{row.orders.toLocaleString()}</td>
                    <td className="py-3">{dollars(row.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-muted">
            A sale to the distributor is kept out of the Direct figure. Sales through KEHE, UNFI, and DSD
            stay on their own rows. Methods with no landed orders are not listed.
          </p>
        </>
      ) : null}
    </Panel>
  );
}

function dollars(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}
