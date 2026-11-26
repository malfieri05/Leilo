import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/panel";
import { listAccounts } from "@/lib/sources/accounts";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return (
    <Suspense fallback={<Panel title="Account book">Loading accounts.</Panel>}>
      <AccountBook />
    </Suspense>
  );
}

async function AccountBook() {
  await connection();
  const list = await listAccounts({ limit: 100 });
  const showing = list.state === "ready" ? list.rows.length : 0;
  const total = list.state === "ready" || list.state === "empty" ? list.total : 0;

  return (
    <Panel title="Account book" action={total ? `${showing} of ${total}` : "Synced"}>
      {list.state === "error" ? <p className="text-sm text-hibiscus">{list.message}</p> : null}
      {list.state === "no-database" ? <p className="text-sm text-muted">The database is not connected.</p> : null}
      {list.state === "empty" ? (
        <p className="text-sm text-muted">
          No accounts yet.{" "}
          <Link href="/sources" className="font-semibold text-heading underline">
            Sync a source
          </Link>
          .
        </p>
      ) : null}
      {list.state === "ready" ? (
        <ul className="divide-y divide-line">
          {list.rows.map((account) => (
            <li key={`${account.source}-${account.externalId}`} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-muted">
                  {account.customerType ?? "No type"} · {account.region ?? "No region"} · {account.source}
                </p>
              </div>
              <p className="text-sm">{account.orderingMethod ?? account.industryType ?? "—"}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}
