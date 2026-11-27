import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { Panel } from "@/components/panel";
import { SegmentControls } from "@/components/sales-filters";
import type { AccountName, MethodCard, SalesOverview } from "@/lib/sources/sales-overview";
import {
  cohortTitle,
  formatSpan,
  salesQueryString,
  segmentLabel,
  type CohortId,
  type ResolvedPeriod,
  type SalesQuery,
} from "@/lib/sources/sales-overview-model";

const SKU_PREVIEW = 8;

export function SalesOverviewView({
  query,
  period,
  report,
}: {
  query: SalesQuery;
  period: ResolvedPeriod;
  report: Extract<SalesOverview, { state: "ready" }>;
}) {
  const orderCount = report.methods.reduce((sum, method) => sum + method.orders, 0);
  const families = report.families.filter((family) => family.family !== "Unmapped" || family.revenue > 0);
  const preview = report.skus.slice(0, SKU_PREVIEW);
  const rest = report.skus.slice(SKU_PREVIEW);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Revenue">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="sm:col-span-2 xl:col-span-4">
            <KpiCard
              label="Total revenue"
              value={money(report.total)}
              delta={totalDelta(report.total, report.priorTotal, orderCount, period)}
              tone={tone(report.total, report.priorTotal)}
            />
          </div>
          {report.methods.map((method) => (
            <KpiCard
              key={method.label}
              label={method.label}
              value={money(method.revenue)}
              delta={methodDelta(method)}
              tone={method.status === "ready" ? tone(method.revenue, method.priorRevenue) : "flat"}
            />
          ))}
        </div>
        {report.distributorNote ? <p className="mt-3 text-sm text-muted">{report.distributorNote}</p> : null}
        {report.unclassifiedOrders > 0 ? (
          <p className="mt-3 text-sm text-muted">
            {report.unclassifiedOrders.toLocaleString()} unclassified orders ({money(report.unclassifiedRevenue)}) are
            not in these method totals. Re-sync Shopify on Sources after rule changes.
          </p>
        ) : null}
        {report.enrichment && report.enrichment.shopifyAccounts > 0 ? (
          <p className="mt-3 text-sm text-muted">
            HubSpot match: {percent(report.enrichment.hubspotMatched / report.enrichment.shopifyAccounts)} of{" "}
            {report.enrichment.shopifyAccounts.toLocaleString()} Shopify retailers ·{" "}
            {report.enrichment.needsType.toLocaleString()} need Industry Type ·{" "}
            <Link href="/accounts?filter=needs-type" className="font-semibold text-heading underline">
              Review accounts
            </Link>
          </p>
        ) : null}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue by SKU" action={period.label}>
          {report.skus.length === 0 ? (
            <p className="text-sm text-muted">
              {report.total > 0 && report.lineRevenue === 0
                ? "These orders have no line amounts yet, so SKU revenue is empty."
                : "No revenue in this period."}
            </p>
          ) : (
            <>
              <SkuTable rows={preview} total={report.lineRevenue} />
              {rest.length > 0 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-heading">
                    Other SKUs ({rest.length})
                  </summary>
                  <div className="mt-3">
                    <SkuTable rows={rest} total={report.lineRevenue} />
                  </div>
                </details>
              ) : null}
            </>
          )}
        </Panel>
        <Panel title="Revenue by product type" action={period.label}>
          <ul className="divide-y divide-line">
            {families.map((family) => (
              <li key={family.family} className="flex items-baseline justify-between gap-3 py-3">
                <span className="font-medium">{family.family}</span>
                <span className="text-sm text-muted">
                  {family.revenue > 0 ? (
                    <>
                      {money(family.revenue)}
                      <span className="ml-2">{share(family.revenue, report.lineRevenue)}</span>
                    </>
                  ) : (
                    "No revenue in this period"
                  )}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <section aria-label="Account health">
        <div className="mb-3">
          <h2 className="font-display text-xl text-heading">Account health</h2>
          <p className="mt-1 text-sm text-muted">
            As of today for retailer accounts (KEHE, UNFI, and DSD partners excluded). A later order on any channel keeps
            the account Active.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <CohortCard query={query} id="lifetime" value={count(report.health.lifetime)} delta="Ever ordered" />
          <CohortCard query={query} id="active" value={count(report.health.active)} delta="Last order within 90 days" />
          <CohortCard query={query} id="at-risk" value={count(report.health.atRisk)} delta="90 to 150 days" />
          <CohortCard query={query} id="past" value={count(report.health.past)} delta="More than 150 days" />
          <CohortCard query={query} id="prospects" value={count(report.health.prospects)} delta="Sample sent, never ordered" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <CohortCard query={query} id="ordered" value={count(report.retention.ordered)} delta={period.label} />
          <CohortCard
            query={query}
            id="one-two"
            value={rate(report.retention.oneTwo, report.retention.yearBuyers)}
            delta={rateDelta(report.retention.oneTwo, report.retention.yearBuyers, "no order in 90 days")}
          />
          <CohortCard
            query={query}
            id="three-plus"
            value={rate(report.retention.threePlus, report.retention.yearBuyers)}
            delta={rateDelta(report.retention.threePlus, report.retention.yearBuyers, "of trailing-year buyers")}
          />
          <CohortCard
            query={query}
            id="year-recent"
            value={rate(report.retention.yearRecent, report.retention.yearBuyers)}
            delta={rateDelta(report.retention.yearRecent, report.retention.yearBuyers, "also ordered in 90 days")}
          />
          <CohortCard
            query={query}
            id="two-year"
            value={rate(report.retention.twoYearRecent, report.retention.twoYearBuyers)}
            delta={rateDelta(report.retention.twoYearRecent, report.retention.twoYearBuyers, "of two-year buyers")}
          />
        </div>
        {query.cohort && report.cohort ? (
          <div className="mt-4" id="accounts">
            <Panel title={cohortTitle(query.cohort)} action={`${report.cohort.total.toLocaleString()} accounts`}>
              <AccountList names={report.cohort.names} total={report.cohort.total} />
            </Panel>
          </div>
        ) : null}
      </section>

      <Panel title="Tier accounts" action={period.label}>
        <p className="mb-4 max-w-3xl text-sm text-muted">
          Direct retailers only, ranked by share of revenue in this period. KEHE, UNFI, and DSD are left out.
          {query.segmentValue ? ` Inside ${segmentLabel(query.segmentValue)}.` : ""}
        </p>
        <SegmentControls query={query} options={report.segmentOptions} />
        {report.tiers.every((band) => band.accounts.length === 0) ? (
          <p className="text-sm text-muted">No Direct retailer revenue in this period.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {report.tiers.map((band) => (
              <details key={band.id} className="rounded-[10px] border border-line px-4 py-3">
                <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-3">
                  <span className="font-medium">{band.label}</span>
                  <span className="text-sm text-muted">
                    {countNoun(band.accounts.length, "account", "accounts")} · {money(band.revenue)} · {percent(band.share)}
                  </span>
                </summary>
                {band.accounts.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">None in this band.</p>
                ) : (
                  <ul className="mt-3 divide-y divide-line">
                    {band.accounts.map((account) => (
                      <li key={account.id} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                        <span>
                          {account.name}
                          {account.industryType || account.customerType ? (
                            <span className="mt-0.5 block text-xs text-muted">
                              {[account.industryType, account.customerType].filter(Boolean).join(" · ")}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted">{money(account.revenue)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </details>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Industry Type" action={period.label}>
        {report.industry.length === 0 ? (
          <p className="text-sm text-muted">No accounts in this view.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                <tr>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Accounts</th>
                  <th className="pb-3 font-medium">Revenue</th>
                  <th className="pb-3 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {report.industry.map((row) => (
                  <tr key={row.type} className="border-t border-line align-top">
                    <td className="py-3 font-medium">
                      {row.type}
                      {row.blankTotal > 0 ? (
                        <details className="mt-2 font-normal">
                          <summary className="cursor-pointer text-sm font-semibold text-heading">
                            Accounts missing a type
                          </summary>
                          <div className="mt-2">
                            <AccountList names={row.blankNames} total={row.blankTotal} />
                          </div>
                        </details>
                      ) : null}
                    </td>
                    <td className="py-3">{row.accounts.toLocaleString()}</td>
                    <td className="py-3">{money(row.revenue)}</td>
                    <td className="py-3">{percent(row.share)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

function CohortCard({
  query,
  id,
  value,
  delta,
}: {
  query: SalesQuery;
  id: CohortId;
  value: string;
  delta: string;
}) {
  const open = query.cohort === id;
  const href = `/sales${salesQueryString(query, { cohort: open ? null : id })}${open ? "" : "#accounts"}`;
  return (
    <Link
      href={href}
      aria-current={open ? "true" : undefined}
      className={`block rounded-[10px] ${open ? "ring-2 ring-sky" : ""}`}
    >
      <KpiCard label={cohortTitle(id)} value={value} delta={delta} tone="flat" />
    </Link>
  );
}

function SkuTable({ rows, total }: { rows: { sku: string; revenue: number }[]; total: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="pb-3 font-medium">SKU</th>
            <th className="pb-3 font-medium">Revenue</th>
            <th className="pb-3 font-medium">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sku} className="border-t border-line">
              <td className="py-3 font-medium">{row.sku}</td>
              <td className="py-3">{money(row.revenue)}</td>
              <td className="py-3 text-muted">{share(row.revenue, total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AccountList({ names, total }: { names: AccountName[]; total: number }) {
  if (names.length === 0) return <p className="text-sm text-muted">No accounts in this group.</p>;
  return (
    <>
      <ul className="max-h-64 divide-y divide-line overflow-y-auto">
        {names.map((account) => (
          <li key={account.id} className="py-2 text-sm">
            {account.name}
          </li>
        ))}
      </ul>
      {total > names.length ? (
        <p className="mt-2 text-sm text-muted">
          Showing {names.length.toLocaleString()} of {total.toLocaleString()}.
        </p>
      ) : null}
    </>
  );
}

function methodDelta(method: MethodCard) {
  if (method.status === "none-landed") return "No orders landed";
  if (method.status === "not-in-region") return "Not split by retailer state";
  if (method.status === "none-in-view") return "No orders in this view";
  if (method.status === "none-in-period") return "No orders in this period";
  const portion = method.share == null ? "" : `${percent(method.share)} of revenue · `;
  return `${portion}${orderCountLabel(method.orders)}${priorSuffix(method.revenue, method.priorRevenue)}`;
}

function totalDelta(current: number, prior: number | null, orders: number, period: ResolvedPeriod) {
  if (!period.from) return `${orderCountLabel(orders)} · All time`;
  return `${orderCountLabel(orders)}${priorSuffix(current, prior)}`;
}

function priorSuffix(current: number, prior: number | null) {
  if (prior == null) return "";
  if (prior === 0) return " · No prior-year revenue";
  const change = Math.round(((current - prior) / prior) * 100);
  const sign = change > 0 ? "+" : "";
  return ` · ${sign}${change}% vs last year (${money(prior)})`;
}

function tone(current: number, prior: number | null): "up" | "down" | "flat" {
  if (prior == null || prior === 0 || current === prior) return "flat";
  return current > prior ? "up" : "down";
}

function rate(part: number, whole: number) {
  if (whole === 0) return "—";
  return percent(part / whole);
}

function rateDelta(part: number, whole: number, note: string) {
  if (whole === 0) return "No buyers in that window";
  return `${part.toLocaleString()} of ${whole.toLocaleString()} · ${note}`;
}

function share(part: number, whole: number) {
  if (whole <= 0) return "—";
  return percent(part / whole);
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function orderCountLabel(value: number) {
  return countNoun(value, "order", "orders");
}

function countNoun(value: number, singular: string, plural: string) {
  return `${value.toLocaleString()} ${value === 1 ? singular : plural}`;
}

function count(value: number) {
  return value.toLocaleString();
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function compareLabel(period: ResolvedPeriod) {
  if (!period.compareFrom || !period.compareTo) return null;
  return formatSpan(period.compareFrom, period.compareTo);
}
