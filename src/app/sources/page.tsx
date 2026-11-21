import { Suspense } from "react";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { ImportForm, SyncAllButton, SyncButton } from "@/components/source-actions";
import { fileSources } from "@/lib/sources/catalog";
import { listSources } from "@/lib/sources/status";

export const metadata = { title: "Sources" };

export default function SourcesPage() {
  return (
    <>
      <PageHeader
        title="Sources"
        description="Each system, how it connects, and the last time a sync succeeded. Credentials are created in the vendor admin and kept in environment variables. Staff portal passwords are not used."
      />
      <Suspense fallback={<Panel title="Connections">Loading source status.</Panel>}>
        <SourcesBody />
      </Suspense>
    </>
  );
}

async function SourcesBody() {
  await connection();
  const { database, error, rows } = await listSources();
  const canSyncAny = rows.some((row) => row.canSync);

  return (
    <>
      {!database ? (
        <p className="mb-4 text-sm text-hibiscus">
          DATABASE_URL is not set, so sync and file import are paused. The list below is the connection plan.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-hibiscus">{error}</p> : null}

      <Panel title="Connections" action="One Leilo organization">
        <div className="mb-5">
          <SyncAllButton disabled={!canSyncAny} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">System</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Last success</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t border-line align-top">
                  <td className="py-3 font-medium">{row.name}</td>
                  <td className="max-w-xs py-3 text-muted">{row.method}</td>
                  <td className="py-3">
                    <span className="block">{row.status}</span>
                    {row.detail ? <span className="mt-1 block text-xs text-muted">{row.detail}</span> : null}
                  </td>
                  <td className="py-3 text-muted">{row.lastSuccess}</td>
                  <td className="py-3">
                    {row.kind === "file" ? (
                      <span className="text-xs uppercase tracking-[0.08em] text-muted">Upload below</span>
                    ) : (
                      <SyncButton source={row.source} disabled={!row.canSync} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="mt-6">
        <Panel title="File inbox" action="KEHE, UNFI, SPINS, DSD, Encompass">
          <p className="mb-4 text-sm text-muted">
            Upload the CSV export. Excel files need to be saved as CSV first. For KEHE, choose Chains and
            Stores or Stock Status. Name the partner on DSD and Encompass files. SPINS 4-packs and items
            under $2,000 stay out of SPINS views.
          </p>
          <ImportForm
            sources={fileSources.map((source) => ({ source: source.source, name: source.name }))}
          />
        </Panel>
      </div>
    </>
  );
}
