import Link from "next/link";
import { Panel } from "@/components/panel";
import type { TrackingLane, TrackingOverview, TrackingRow } from "@/lib/sources/tracking-overview";

export function TrackingView({ report }: { report: Extract<TrackingOverview, { state: "ready" }> }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        Shopify {when(report.shopifySyncedAt)}. ShipStation {when(report.shipstationSyncedAt)}. LTL sheet{" "}
        {when(report.sheetsSyncedAt)}.{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sync on Sources
        </Link>
        . A line stays here until 21 days after delivery.
      </p>
      <TrackingPanel
        title="POS tracking"
        lane={report.pos}
        empty="No open POS or merch shipments. Sync Shopify and ShipStation. Orders tagged POS, merch, or merchandise show up here."
      />
      <TrackingPanel
        title="Sample tracking"
        lane={report.sample}
        empty="No open sample shipments. Sync Shopify and ShipStation. Orders tagged sample show up here."
      />
      <TrackingPanel
        title="LTL tracking"
        lane={report.ltl}
        empty="No open LTL shipments. Sync Google Sheets. Only #B- orders on the Kehe tab are kept."
      />
    </div>
  );
}

function TrackingPanel({ title, lane, empty }: { title: string; lane: TrackingLane; empty: string }) {
  const action = lane.total === 0 ? "None open" : shown(lane.rows.length, lane.total);
  return (
    <Panel title={title} action={action}>
      {lane.rows.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Reference</th>
                <th className="pb-3 font-medium">Destination</th>
                <th className="pb-3 font-medium">Carrier</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Tracking</th>
                <th className="pb-3 font-medium">Relevant until</th>
              </tr>
            </thead>
            <tbody>
              {lane.rows.map((row, index) => (
                <tr key={`${row.reference}-${index}`} className="border-t border-line">
                  <td className="py-3 font-medium">{row.reference}</td>
                  <td className="py-3">{row.destination ?? "—"}</td>
                  <td className="py-3">{row.carrier ?? "—"}</td>
                  <td className="py-3">{statusLabel(row.status)}</td>
                  <td className="py-3">
                    <TrackingLink row={row} />
                  </td>
                  <td className="py-3 text-muted">{row.relevantUntil ?? "Until delivered"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function TrackingLink({ row }: { row: TrackingRow }) {
  const href = linkHref(row);
  if (!href) return <span className="text-muted">{row.trackingNumber ?? "—"}</span>;
  return (
    <a href={href} className="font-semibold text-heading underline" target="_blank" rel="noreferrer">
      {row.trackingNumber || "Track"}
    </a>
  );
}

function linkHref(row: TrackingRow) {
  if (row.trackingUrl && /^https?:/i.test(row.trackingUrl)) return row.trackingUrl;
  if (row.trackingNumber && /^https?:/i.test(row.trackingNumber)) return row.trackingNumber;
  return null;
}

function statusLabel(status: string) {
  if (status === "in_transit") return "In transit";
  if (status === "delivered") return "Delivered";
  return status;
}

function shown(count: number, total: number) {
  if (total > count) return `${count} of ${total}`;
  return String(total);
}

function when(value: string | null) {
  if (!value) return "not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
