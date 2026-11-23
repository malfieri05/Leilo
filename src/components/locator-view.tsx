import Link from "next/link";
import { Panel } from "@/components/panel";
import type { StoreLocation } from "@/lib/store-locations";

export function LocatorView({
  report,
}: {
  report: Extract<Awaited<ReturnType<typeof import("@/lib/store-locations").loadLocatorTable>>, { state: "ready" }>;
}) {
  const sheetLinked = Boolean(process.env.GOOGLE_SHEET_LOCATOR_ID?.trim());
  const geoCount = report.rows.filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng)).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {report.source === "sheet"
          ? `Live from the Leilo locations Google Sheet${report.syncedAt ? ` · last sync ${when(report.syncedAt)}` : ""}.`
          : "Showing the Closeby snapshot until the Leilo locations sheet is shared and synced."}{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        {sheetLinked ? null : (
          <>
            {" "}
            · Set <code className="text-xs">GOOGLE_SHEET_LOCATOR_ID</code> in the environment.
          </>
        )}
      </p>

      <LocatorStats rows={report.rows.length} geoCount={geoCount} regions={report.regions.length} />

      <Panel title="Doors" action={`${report.rows.length.toLocaleString()} locations`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-2 font-medium">Store</th>
                <th className="pb-2 font-medium">City</th>
                <th className="pb-2 font-medium">Region</th>
                <th className="pb-2 font-medium">Channel</th>
                <th className="pb-2 font-medium">Last updated</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.slice(0, 500).map((row) => (
                <tr key={String(row.id)} className="border-t border-line align-top">
                  <td className="py-2 pr-3 font-medium text-heading">
                    {row.name}
                    {row.address ? <span className="mt-0.5 block text-xs font-normal text-muted">{row.address}</span> : null}
                  </td>
                  <td className="py-2 pr-3 text-muted">{row.city || "—"}</td>
                  <td className="py-2 pr-3 text-muted">{row.region || "—"}</td>
                  <td className="py-2 pr-3 text-muted">{row.channel || "—"}</td>
                  <td className="py-2 text-muted">{row.lastUpdated || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {report.rows.length > 500 ? (
          <p className="mt-3 text-xs text-muted">First 500 rows shown. Open the Map tab for the full geocoded list.</p>
        ) : null}
      </Panel>

      <p className="text-sm text-muted">
        Map pins use rows with latitude and longitude.{" "}
        <Link href="/map" className="text-heading underline">
          Open map
        </Link>
        .
      </p>
    </div>
  );
}

function LocatorStats({
  rows,
  geoCount,
  regions,
}: {
  rows: number;
  geoCount: number;
  regions: number;
}) {
  return (
    <StatsGrid>
      <Stat label="Doors" value={rows.toLocaleString()} />
      <Stat label="On the map" value={geoCount.toLocaleString()} />
      <Stat label="Regions" value={String(regions)} />
    </StatsGrid>
  );
}

function StatsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-3">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[10px] border border-line bg-paper p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-heading">{value}</p>
    </article>
  );
}

function when(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" }).format(
    date,
  );
}