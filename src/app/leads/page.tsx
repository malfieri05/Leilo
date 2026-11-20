import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { listAccounts } from "@/lib/sources/accounts";

export const metadata: Metadata = { title: "Lead Generation" };

export default function LeadsPage() {
  return (
    <>
      <PageHeader
        title="Lead Generation"
        description="Prospects that have not ordered yet. A company counts here when HubSpot customer type is Prospect, or when that field is still blank."
      />
      <Suspense fallback={<Panel title="Prospects">Loading HubSpot companies.</Panel>}>
        <Prospects />
      </Suspense>
    </>
  );
}

async function Prospects() {
  await connection();
  const list = await listAccounts({ source: "hubspot", prospects: true, limit: 100 });
  const showing = list.state === "ready" ? list.rows.length : 0;
  const total = list.state === "ready" || list.state === "empty" ? list.total : 0;

  return (
    <Panel title="Prospects" action={total ? `${showing} of ${total}` : "HubSpot"}>
      <p className="mb-4 max-w-3xl text-sm text-muted">
        Companies with customer type Prospect, or with no customer type yet. Refresh the list from{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        .
      </p>
      {list.state === "error" ? <p className="text-sm text-hibiscus">{list.message}</p> : null}
      {list.state === "no-database" ? <p className="text-sm text-muted">The database is not connected.</p> : null}
      {list.state === "empty" ? (
        <p className="text-sm text-muted">No prospect companies yet. Sync HubSpot on Sources.</p>
      ) : null}
      {list.state === "ready" ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Account</th>
                <th className="pb-3 font-medium">Region</th>
                <th className="pb-3 font-medium">Industry</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium">Method</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.map((account) => (
                <tr key={account.name} className="border-t border-line">
                  <td className="py-3 font-medium">{account.name}</td>
                  <td className="py-3">{account.region ?? "—"}</td>
                  <td className="py-3">{account.industryType ?? "—"}</td>
                  <td className="py-3">{account.customerType ?? "Unset"}</td>
                  <td className="py-3">{account.orderingMethod ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </Panel>
  );
}
