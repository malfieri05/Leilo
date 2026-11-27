import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/panel";
import { hubspotCompanyUrl, listAccounts, listEnrichedShopifyAccounts } from "@/lib/sources/accounts";

export const metadata: Metadata = { title: "Accounts" };

export default function AccountsPage({
  searchParams,
}: PageProps<"/accounts">) {
  return (
    <Suspense fallback={<Panel title="Account book">Loading accounts.</Panel>}>
      <AccountBook searchParams={searchParams} />
    </Suspense>
  );
}

async function AccountBook({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const params = await searchParams;
  const rawView = param(params.view) === "raw";
  const filterNeedsType = param(params.filter) === "needs-type";
  const filterNoMatch = param(params.filter) === "no-match";

  if (rawView) {
    return <RawAccountBook />;
  }

  const list = await listEnrichedShopifyAccounts({
    limit: 100,
    needsType: filterNeedsType,
    needsHubSpotMatch: filterNoMatch,
  });
  const showing = list.state === "ready" ? list.rows.length : 0;
  const total = list.state === "ready" || list.state === "empty" ? list.total : 0;

  return (
    <Panel
      title="Retail accounts (Shopify + HubSpot)"
      action={
        <span className="flex flex-wrap items-center gap-3 text-sm font-normal">
          {total ? `${showing} of ${total}` : "Synced"}
          <Link href="/accounts?view=raw" className="font-semibold text-heading underline">
            All source rows
          </Link>
        </span>
      }
    >
      <p className="mb-4 text-sm text-muted">
        Industry Type, Customer Type, and Ordering Method come from HubSpot when the company name matches the Shopify
        shipping company. Re-sync Shopify on Sources after identity changes.
      </p>
      <FilterLinks active={filterNeedsType ? "needs-type" : filterNoMatch ? "no-match" : null} />
      {list.state === "error" ? <p className="text-sm text-hibiscus">{list.message}</p> : null}
      {list.state === "no-database" ? <p className="text-sm text-muted">The database is not connected.</p> : null}
      {list.state === "empty" ? (
        <p className="text-sm text-muted">
          No accounts in this view.{" "}
          <Link href="/sources" className="font-semibold text-heading underline">
            Sync Shopify and HubSpot
          </Link>
          .
        </p>
      ) : null}
      {list.state === "ready" ? (
        <ul className="divide-y divide-line">
          {list.rows.map((account) => (
            <li key={account.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="font-medium">{account.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {account.industryType ?? "Needs a type"}
                  {account.customerType ? ` · ${account.customerType}` : ""}
                  {account.region ? ` · ${account.region}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {!account.hubspotMatched ? (
                    <span className="rounded-full bg-paper px-2 py-0.5 ring-1 ring-line">No HubSpot match</span>
                  ) : null}
                  {account.needsType ? (
                    <span className="rounded-full bg-paper px-2 py-0.5 ring-1 ring-line">Needs a type</span>
                  ) : null}
                  {account.hubspotOrderingMethod ? (
                    <span className="text-muted">CRM: {account.hubspotOrderingMethod}</span>
                  ) : null}
                </div>
              </div>
              {account.hubspotExternalId ? (
                <a
                  href={hubspotCompanyUrl(account.hubspotExternalId) ?? "#"}
                  className="shrink-0 text-sm font-semibold text-heading underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  HubSpot
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </Panel>
  );
}

function FilterLinks({ active }: { active: "needs-type" | "no-match" | null }) {
  return (
    <p className="mb-4 flex flex-wrap gap-3 text-sm">
      <Link href="/accounts" className={active === null ? "font-semibold text-heading" : "text-muted underline"}>
        All Shopify retailers
      </Link>
      <Link
        href="/accounts?filter=needs-type"
        className={active === "needs-type" ? "font-semibold text-heading" : "text-muted underline"}
      >
        Needs a type
      </Link>
      <Link
        href="/accounts?filter=no-match"
        className={active === "no-match" ? "font-semibold text-heading" : "text-muted underline"}
      >
        No HubSpot match
      </Link>
    </p>
  );
}

async function RawAccountBook() {
  const list = await listAccounts({ limit: 100 });
  const showing = list.state === "ready" ? list.rows.length : 0;
  const total = list.state === "ready" || list.state === "empty" ? list.total : 0;

  return (
    <Panel
      title="All synced accounts"
      action={
        <Link href="/accounts" className="text-sm font-semibold text-heading underline">
          Enriched Shopify view
        </Link>
      }
    >
      {list.state === "error" ? <p className="text-sm text-hibiscus">{list.message}</p> : null}
      {list.state === "no-database" ? <p className="text-sm text-muted">The database is not connected.</p> : null}
      {list.state === "empty" ? <p className="text-sm text-muted">No accounts yet.</p> : null}
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
      {total ? <p className="mt-3 text-sm text-muted">{showing} of {total}</p> : null}
    </Panel>
  );
}

function param(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}