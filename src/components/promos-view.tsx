import Link from "next/link";
import { Panel } from "@/components/panel";
import { PromoCalendarMonths } from "@/components/promo-calendar-months";
import { channelMatches, monthName, parseMonthLabel, type PromoQuery } from "@/lib/sources/promo-model";
import type { PromoOverview } from "@/lib/sources/promo-overview";

export function PromosView({ report, query }: { report: Extract<PromoOverview, { state: "ready" }>; query: PromoQuery }) {
  const matrixRows = report.matrix.rows.filter((row) => channelMatches(row.channel, query.channel));

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {report.sourceNote || "Upload the promotion calendar on Sources."}{" "}
        <Link href="/sources" className="font-semibold text-heading underline">
          Sources
        </Link>
        . A promo is not a sale until the ship date falls inside the window and the order is in the books.
      </p>

      {query.view === "calendar" ? (
        <PromoCalendarMonths events={report.yearAgenda} query={query} />
      ) : null}

      {query.view === "matrix" ? (
        <Panel title="Calendar matrix" action={`${matrixRows.length} accounts`}>
          {matrixRows.length === 0 ? (
            <p className="text-sm text-muted">Upload the promotion calendar on Sources.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-max border-separate border-spacing-0 text-left text-xs">
                <thead className="text-[10px] uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="sticky left-0 bg-paper px-2 py-2 font-medium">Account</th>
                    {report.matrix.months.map((label) => (
                      <th key={label} className={`px-2 py-2 font-medium ${highlighted(label, query) ? "text-heading" : ""}`}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixRows.map((row, index) => (
                    <tr key={`${row.account}-${index}`}>
                      <th className="sticky left-0 bg-paper px-2 py-2 text-left font-medium text-heading">{row.account}</th>
                      {report.matrix.months.map((label, cellIndex) => {
                        const value = row.cells[cellIndex] ?? "";
                        return (
                          <td
                            key={label}
                            title={value}
                            className={`max-w-40 truncate border-t border-line px-2 py-2 ${highlighted(label, query) ? "bg-foam text-heading" : "text-muted"}`}
                          >
                            {value}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      ) : null}

      {query.view === "agenda" ? (
        <Panel title="Agenda" action={query.month === "all" ? String(query.year) : `${monthName(query.month)} ${query.year}`}>
          {report.agenda.length === 0 ? (
            <p className="text-sm text-muted">No promotions in this month and channel. Try All months, or upload the calendar on Sources.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="py-2 font-medium">Account</th>
                  <th className="py-2 font-medium">Distributor</th>
                  <th className="py-2 font-medium">Dates</th>
                  <th className="py-2 font-medium">Summary</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.agenda.map((row) => (
                  <tr key={row.eventKey} className="border-t border-line align-top">
                    <td className="py-2 pr-3 text-heading">
                      {row.account}
                      <span className="block text-xs text-muted">{row.accountType}</span>
                    </td>
                    <td className="py-2 pr-3 text-muted">{row.distributor}</td>
                    <td className="py-2 pr-3 text-muted">{dates(row.startDate, row.endDate, row.monthLabel)}</td>
                    <td className="py-2 pr-3 text-heading">{row.summary}</td>
                    <td className="py-2 text-xs uppercase tracking-[0.12em] text-heading">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      ) : null}

      <Panel title="Legend" action="From the sheet">
        <ul className="grid gap-2 text-sm text-muted sm:grid-cols-2">
          <li>Cancelled — the deal was called off.</li>
          <li>Planned — proposed or still waiting on a buyer.</li>
          <li>Submitted — entered or waiting on a portal.</li>
          <li>Hold — paused, including when it may conflict with a cancelled KEHE OI.</li>
        </ul>
      </Panel>
    </div>
  );
}

function highlighted(label: string, query: PromoQuery) {
  const parsed = parseMonthLabel(label);
  if (!parsed || parsed.year !== query.year) return false;
  return query.month === "all" || parsed.month === query.month;
}

function dates(start: string | null, end: string | null, monthLabel: string) {
  if (start && end) return `${start} – ${end}`;
  return monthLabel;
}