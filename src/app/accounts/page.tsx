import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { accounts } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage() {
  return (
    <>
      <PageHeader
        title="Accounts"
        description="Retail, on-prem, and e-comm accounts that matter to the Head of Sales. Ready for CRM or spreadsheet import."
      />
      <Panel title="Account book" action={`${accounts.length} records`}>
        <ul className="divide-y divide-line">
          {accounts.map((account) => (
            <li key={account.name} className="flex flex-wrap items-baseline justify-between gap-2 py-4">
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-sm text-muted">
                  {account.type} · {account.status} · {account.owner}
                </p>
              </div>
              <p className="text-sm">{account.cases.toLocaleString()} cases MTD</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
