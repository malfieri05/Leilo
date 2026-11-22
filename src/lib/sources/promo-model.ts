import { stableId } from "@/lib/sources/fields";
import type { PromoEventDraft, PromoMatrixRow, PromoSnapshotDraft } from "@/lib/sources/types";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;

export const PROMO_CHANNELS = ["all", "kehe", "unfi", "direct", "dsd"] as const;
export type PromoChannelFilter = (typeof PROMO_CHANNELS)[number];
export const PROMO_VIEWS = ["agenda", "matrix"] as const;
export type PromoView = (typeof PROMO_VIEWS)[number];

export type PromoQuery = {
  year: number;
  month: number | "all";
  channel: PromoChannelFilter;
  view: PromoView;
};

export function parseMonthLabel(label: string) {
  const match = label.trim().match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})$/i);
  if (!match) return null;
  return {
    month: MONTHS.indexOf(match[1].slice(0, 3).toLowerCase() as (typeof MONTHS)[number]) + 1,
    year: Number(match[2]),
    label: label.trim(),
  };
}

export function inferPromoStatus(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("cancelled") || lower.includes("canceled") || lower.includes("deleted")) return "cancelled";
  if (/\bhold\b/.test(lower)) return "hold";
  if (lower.includes("submitted") || lower.includes("to be entered")) return "submitted";
  if (/\b(planned|proposed|pitched|tbd)\b/.test(lower)) return "planned";
  return "active";
}

export function inferChannel(distributor: string, accountType: string) {
  const source = distributor.toLowerCase();
  const type = accountType.toLowerCase();
  if (/\bmexcor\b|\blad\b|\bdsd\b/.test(source)) return "DSD";
  if (type.includes("online") || source === "direct" || source.startsWith("direct")) return "Direct";
  const kehe = /kehe|ke he/.test(source);
  const unfi = /unfi/.test(source);
  if (kehe && unfi) return "KEHE/UNFI";
  if (unfi) return "UNFI";
  if (kehe) return "KEHE";
  return "Other";
}

export function channelMatches(channel: string, filter: PromoChannelFilter) {
  if (filter === "all") return true;
  const value = channel.toLowerCase();
  if (filter === "kehe") return value.includes("kehe");
  if (filter === "unfi") return value.includes("unfi");
  if (filter === "direct") return value === "direct";
  return value === "dsd";
}

export function parseDateRange(text: string, fallbackYear: number) {
  const full = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (full) return { start: ymd(full[1], full[2], full[3]), end: ymd(full[4], full[5], full[6]) };
  const endYear = text.match(/(\d{1,2})\/(\d{1,2})\s*[-–]\s*(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (endYear) {
    const end = ymd(endYear[3], endYear[4], endYear[5]);
    let start = ymd(endYear[1], endYear[2], endYear[5]);
    if (start > end) start = ymd(endYear[1], endYear[2], String(Number(end.slice(0, 4)) - 1));
    return { start, end };
  }
  const bare = text.match(/(\d{1,2})\/(\d{1,2})\s*[-–]\s*(\d{1,2})\/(\d{1,2})(?!\d)/);
  if (bare) {
    let start = ymd(bare[1], bare[2], String(fallbackYear));
    let end = ymd(bare[3], bare[4], String(fallbackYear));
    if (start > end) end = ymd(bare[3], bare[4], String(fallbackYear + 1));
    return { start, end };
  }
  return { start: null, end: null };
}

export function parsePromoCalendarTable(rows: string[][]) {
  const headerIndex = rows.findIndex((row) => cell(row, 0).toLowerCase() === "account" && row.some((value) => parseMonthLabel(value)));
  if (headerIndex < 0) throw new Error("That file is not a promotion calendar. Expected Account and month columns.");
  const header = rows[headerIndex];
  const months = header
    .map((label, index) => ({ index, parsed: parseMonthLabel(label) }))
    .filter((column): column is { index: number; parsed: { year: number; month: number; label: string } } => Boolean(column.parsed));
  const notesIndex = header.findIndex((label, index) => index > 2 && !parseMonthLabel(label) && label.trim());
  const title = rows.slice(0, headerIndex).map((row) => cell(row, 0)).find((value) => value) ?? "Promotion calendar";
  const sourceNote =
    rows
      .slice(0, headerIndex)
      .map((row) => row.map((value) => value.trim()).filter(Boolean).join(" "))
      .find((value) => value.length > 40 && !/^account\b/i.test(value)) ?? "";

  const events: PromoEventDraft[] = [];
  const matrixRows: PromoMatrixRow[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    const account = cell(row, 0);
    if (/^legend$/i.test(account)) break;
    const accountType = cell(row, 1);
    const distributor = cell(row, 2);
    const notes = notesIndex >= 0 ? cell(row, notesIndex) : "";
    const cells = months.map((column) => cell(row, column.index));
    if (!account && !accountType && !distributor && cells.every((value) => !value)) {
      if (matrixRows.length > 0) break;
      continue;
    }
    if (!account) continue;
    const channel = inferChannel(distributor, accountType);
    const rowOrder = matrixRows.length;
    matrixRows.push({
      account,
      accountType,
      distributor,
      channel,
      notes: notes || null,
      cells,
    });
    months.forEach((column, index) => {
      const summary = cells[index];
      if (!summary) return;
      const dates = parseDateRange(summary, column.parsed.year);
      events.push({
        eventKey: stableId([account, String(rowOrder), String(column.parsed.year), String(column.parsed.month), summary.trim().toLowerCase()]),
        account,
        accountType: accountType || null,
        distributor: distributor || null,
        channel,
        year: column.parsed.year,
        month: column.parsed.month,
        monthLabel: column.parsed.label,
        summary,
        status: inferPromoStatus(summary),
        startDate: dates.start,
        endDate: dates.end,
        rowOrder,
        notes: notes || null,
      });
    });
  }
  const snapshot: PromoSnapshotDraft = {
    title,
    sourceNote,
    months: months.map((column) => column.parsed.label),
    rows: matrixRows,
  };
  return { events, snapshot };
}

export function parsePromoQuery(input: Record<string, string | string[] | undefined>, today = new Date()): PromoQuery {
  const year = numberIn(one(input.year), 2020, 2035, today.getFullYear());
  const monthText = one(input.month);
  const month = monthText === "all" ? "all" : numberIn(monthText, 1, 12, today.getMonth() + 1);
  const channel = oneOf(one(input.channel), PROMO_CHANNELS, "all");
  const view = oneOf(one(input.view), PROMO_VIEWS, "agenda");
  return { year, month, channel, view };
}

export function promoQueryString(query: PromoQuery, patch: Partial<PromoQuery> = {}, today = new Date()) {
  const next: PromoQuery = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.year !== today.getFullYear()) params.set("year", String(next.year));
  const defaultMonth = today.getMonth() + 1;
  if (next.month === "all" || next.month !== defaultMonth) params.set("month", String(next.month));
  if (next.channel !== "all") params.set("channel", next.channel);
  if (next.view !== "agenda") params.set("view", next.view);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function monthName(month: number) {
  return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month - 1] ?? String(month);
}

function ymd(month: string, day: string, year: string) {
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function cell(row: string[], index: number) {
  return (row[index] ?? "").replace(/\s+/g, " ").trim();
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function oneOf<T extends string>(value: string, allowed: readonly T[], fallback: T) {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function numberIn(value: string, min: number, max: number, fallback: number) {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount < min || amount > max) return fallback;
  return amount;
}
