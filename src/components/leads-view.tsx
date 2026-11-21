import Link from "next/link";
import { LeadsCompetitorForm } from "@/components/leads-competitor-form";
import { Panel } from "@/components/panel";
import type { AccountList } from "@/lib/sources/accounts";
import type { LeadChannel, LeadCohort, LeadsOverview, UpsellAccount } from "@/lib/sources/leads-overview";
import type { ResolvedPeriod } from "@/lib/sources/sales-overview-model";

const CHANNELS: LeadChannel[] = ["KEHE", "Direct", "DSD"];

export function LeadsView({
  report,
  prospects,
  period,
}: {
  report: Extract<LeadsOverview, { state: "ready" }>;
  prospects: AccountList;
  period: ResolvedPeriod;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        At Risk and Past use each channel’s last ship date against today. Revenue sort uses {period.label}. Scraping
        competitor store locators comes later.
      </p>

      <CohortPanel title="At Risk" note="Last order 90–150 days ago" cohorts={report.atRisk} />
      <CohortPanel title="Past" note="Last order more than 150 days ago" cohorts={report.past} />

      <div className="grid gap-4 xl:grid-cols-3">
        {CHANNELS.map((channel) => (
          <UpsellPanel key={channel} channel={channel} rows={report.upsells[channel].rows} total={report.upsells[channel].total} />
        ))}
      </div>

      <Panel title="New leads" action="HubSpot prospects">
        <ProspectTable prospects={prospects} />
      </Panel>

      <Panel title="Competitor names" action="No locator scrape yet">
        <LeadsCompetitorForm />
        <ul className="mt-4 flex flex-wrap gap-2">
          {report.competitors.map((name) => (
            <li key={name} className="rounded-full border border-line px-3 py-1 text-sm text-heading">
              {name}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Lookalikes" action="Waiting on doors">
        <p className="text-sm text-muted">
          A lookalike needs an Industry Type, the same region, and a competitor door. Store-locator lists for these
          brands are not in ARK yet.
        </p>
      </Panel>
    </div>
  );
}

function CohortPanel({ title, note, cohorts }: { title: string; note: string; cohorts: Record<LeadChannel, LeadCohort> }) {
  return (
    <Panel title={title} action={note}>
      <div className="grid gap-4 xl:grid-cols-3">
        {CHANNELS.map((channel) => (
          <ChannelTable key={channel} channel={channel} cohort={cohorts[channel]} />
        ))}
      </div>
    </Panel>
  );
}

function ChannelTable({ channel, cohort }: { channel: LeadChannel; cohort: LeadCohort }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="font-display text-lg text-heading">{channel}</h3>
        <p className="text-xs uppercase tracking-[0.14em] text-muted">{shown(cohort.rows.length, cohort.total)}</p>
      </div>
      {cohort.total === 0 ? (
        <EmptyChannel channel={channel} />
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="py-2 font-medium">Account</th>
              <th className="py-2 font-medium">Last order</th>
              <th className="py-2 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {cohort.rows.map((row) => (
              <tr key={row.name} className="border-t border-line">
                <td className="py-2 pr-2 text-heading">
                  {row.name}
                  <span className="block text-xs text-muted">{row.industry}</span>
                </td>
                <td className="py-2 text-muted">{row.lastShip ?? "—"}</td>
                <td className="py-2 text-right tabular-nums text-heading">{money(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function UpsellPanel({ channel, rows, total }: { channel: LeadChannel; rows: UpsellAccount[]; total: number }) {
  return (
    <Panel title={`${channel} upsell`} action={shown(rows.length, total)}>
      {total === 0 ? (
        <EmptyChannel channel={channel} />
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.name} className="border-t border-line pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-heading">{row.name}</p>
                <p className="text-sm tabular-nums text-heading">{money(row.revenue)}</p>
              </div>
              <p className="text-xs text-muted">{row.industry}</p>
              {row.highVolume ? <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-heading">Display shipper</p> : null}
              <p className="mt-1 text-xs text-muted">Missing {row.missing.join(", ")}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function ProspectTable({ prospects }: { prospects: AccountList }) {
  if (prospects.state === "no-database") return <p className="text-sm text-muted">Connect the database to list HubSpot prospects.</p>;
  if (prospects.state === "error") return <p className="text-sm text-muted">{prospects.message}</p>;
  if (prospects.state === "empty") return <p className="text-sm text-muted">No HubSpot prospect companies yet.</p>;
  return (
    <>
      <p className="mb-3 text-xs uppercase tracking-[0.14em] text-muted">{shown(prospects.rows.length, prospects.total)}</p>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            <th className="py-2 font-medium">Company</th>
            <th className="py-2 font-medium">Industry</th>
            <th className="py-2 font-medium">Region</th>
          </tr>
        </thead>
        <tbody>
          {prospects.rows.map((row) => (
            <tr key={row.externalId} className="border-t border-line">
              <td className="py-2 text-heading">{row.name}</td>
              <td className="py-2 text-muted">{row.industryType || "Needs a type"}</td>
              <td className="py-2 text-muted">{row.region || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function EmptyChannel({ channel }: { channel: LeadChannel }) {
  if (channel === "DSD") {
    return (
      <p className="text-sm text-muted">
        No DSD sales through a partner yet. Upload a partner file on{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        .
      </p>
    );
  }
  if (channel === "KEHE") {
    return (
      <p className="text-sm text-muted">
        No KEHE sales through to stores yet. Upload Chains and Stores on{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        .
      </p>
    );
  }
  return <p className="text-sm text-muted">No Direct accounts in this window for the selected region.</p>;
}

function shown(visible: number, total: number) {
  return `${count(visible)} of ${count(total)}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function count(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
