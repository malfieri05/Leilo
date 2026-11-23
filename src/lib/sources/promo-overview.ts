import { ensureSchema, getSql, hasDatabase, leiloOrganizationId, publicError } from "@/lib/db";
import { channelMatches, monthName, type PromoQuery } from "@/lib/sources/promo-model";
import type { PromoMatrixRow } from "@/lib/sources/types";

export type PromoAgendaRow = {
  eventKey: string;
  account: string;
  accountType: string | null;
  distributor: string | null;
  channel: string;
  monthLabel: string;
  summary: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

export type PromoOverview =
  | { state: "no-database" }
  | { state: "error"; message: string }
  | {
      state: "ready";
      title: string;
      sourceNote: string;
      syncedAt: string | null;
      byMonth: { month: number; label: string; count: number }[];
      agenda: PromoAgendaRow[];
      yearAgenda: PromoAgendaRow[];
      matrix: { months: string[]; rows: PromoMatrixRow[] };
      summary: { shown: number; cancelled: number; kehe: number; unfi: number };
    };

export async function loadPromos(query: PromoQuery): Promise<PromoOverview> {
  if (!hasDatabase()) return { state: "no-database" };
  const sql = getSql();
  if (!sql) return { state: "no-database" };

  try {
    await ensureSchema();
    const organizationId = await leiloOrganizationId(sql);
    const [eventRows, snapshotRows] = await Promise.all([
      sql.query(
        `SELECT event_key, account, account_type, distributor, channel, year, month, month_label,
                summary, status, start_date::text AS start_date, end_date::text AS end_date
         FROM promo_events
         WHERE organization_id = $1
         ORDER BY account, start_date NULLS LAST, month_label`,
        [organizationId],
      ),
      sql.query(
        `SELECT title, source_note, matrix, s.finished_at
         FROM promo_calendar_snapshots p
         LEFT JOIN sync_runs s ON s.id = p.sync_run_id
         WHERE p.organization_id = $1`,
        [organizationId],
      ),
    ]);
    const events = asRows(eventRows).map(toAgenda);
    const snapshot = first(snapshotRows);
    const matrix = parseMatrix(snapshot.matrix);
    const yearEvents = events.filter(
      (event) =>
        channelMatches(event.channel, query.channel) &&
        (event.year === query.year || event.year === query.year + 1),
    );
    const toRow = (event: (typeof yearEvents)[number]): PromoAgendaRow => {
      const { year: _year, month: _month, ...row } = event;
      return row;
    };
    const yearAgenda = yearEvents.map(toRow);
    const agenda = yearEvents
      .filter((event) => query.month === "all" || event.month === query.month)
      .map(toRow);
    const byMonth = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return {
        month,
        label: monthName(month).slice(0, 3),
        count: yearEvents.filter((event) => event.month === month).length,
      };
    });
    return {
      state: "ready",
      title: text(snapshot.title) || "Promotion calendar",
      sourceNote: text(snapshot.source_note),
      syncedAt: text(snapshot.finished_at) || null,
      byMonth,
      agenda,
      yearAgenda,
      matrix,
      summary: {
        shown: agenda.length,
        cancelled: agenda.filter((event) => event.status === "cancelled").length,
        kehe: agenda.filter((event) => event.channel.toLowerCase().includes("kehe")).length,
        unfi: agenda.filter((event) => event.channel.toLowerCase().includes("unfi")).length,
      },
    };
  } catch (error) {
    return { state: "error", message: publicError(error) };
  }
}

function toAgenda(row: Record<string, unknown>): PromoAgendaRow & { year: number; month: number } {
  return {
    eventKey: text(row.event_key),
    account: text(row.account),
    accountType: text(row.account_type) || null,
    distributor: text(row.distributor) || null,
    channel: text(row.channel),
    year: num(row.year),
    month: num(row.month),
    monthLabel: text(row.month_label),
    summary: text(row.summary),
    status: text(row.status) || "active",
    startDate: text(row.start_date) || null,
    endDate: text(row.end_date) || null,
  };
}

function parseMatrix(value: unknown): { months: string[]; rows: PromoMatrixRow[] } {
  const parsed = typeof value === "string" ? safeJson(value) : value;
  if (!parsed || typeof parsed !== "object") return { months: [], rows: [] };
  const record = parsed as { months?: unknown; rows?: unknown };
  const months = Array.isArray(record.months) ? record.months.map((item) => text(item)) : [];
  const rows = Array.isArray(record.rows)
    ? record.rows.filter(isRecord).map((row) => ({
        account: text(row.account),
        accountType: text(row.accountType),
        distributor: text(row.distributor),
        channel: text(row.channel),
        notes: text(row.notes) || null,
        cells: Array.isArray(row.cells) ? row.cells.map((cell) => text(cell)) : [],
      }))
    : [];
  return { months, rows };
}

function safeJson(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRows(value: unknown) {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function first(value: unknown) {
  return asRows(value)[0] ?? {};
}

function text(value: unknown) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function num(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}
