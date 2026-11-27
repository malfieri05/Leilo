import { createHash } from "node:crypto";
import type { OrderingMethod, SalesDirection } from "@/lib/sources/types";

export function stableId(parts: string[]) {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 32);
}

export function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

/** Retailer display name for HubSpot name matching (shipping company on B2B orders). */
export function normalizeAccountName(value: string | null | undefined) {
  const trimmed = value?.trim().replace(/\s+/g, " ").replace(/[.,;:]+$/g, "") ?? "";
  return trimmed;
}

export function money(value: string) {
  const cleaned = value.replace(/[$,\s]/g, "").replace(/^\((.*)\)$/, "-$1");
  if (!cleaned) return null;
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

export function quantity(value: string) {
  const amount = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(amount) ? amount : null;
}

export function isoDate(value: string) {
  const trimmed = value.trim();
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const us = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (!us) return null;
  const year = us[3].length === 2 ? `20${us[3]}` : us[3];
  return `${year}-${us[1].padStart(2, "0")}-${us[2].padStart(2, "0")}`;
}

export function plusDays(isoDay: string, days: number) {
  const parsed = isoDate(isoDay);
  if (!parsed) return null;
  const date = new Date(`${parsed}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function pick(row: Record<string, string>, names: string[]) {
  const entries = Object.entries(row).map(
    ([key, value]) => [key.trim().toLowerCase(), value.trim()] as const,
  );
  for (const name of names) {
    const found = entries.find(([key]) => key === name);
    if (found?.[1]) return found[1];
  }
  for (const name of names) {
    if (name.length < 4) continue;
    const found = entries.find(([key]) => key.includes(name));
    if (found?.[1]) return found[1];
  }
  return "";
}

export function orderingMethodFromText(value: string | null | undefined): OrderingMethod {
  const text = (value ?? "").toLowerCase();
  if (text.includes("kehe") || text.includes("ke he")) return "KEHE";
  if (text.includes("unfi")) return "UNFI";
  if (text.includes("dsd") || text.includes("encompass")) return "DSD";
  return "Direct";
}

export function saleDirection(method: OrderingMethod, channel: "api" | "file"): {
  direction: SalesDirection;
  excludeFromDirect: boolean;
} {
  if (channel === "file") return { direction: "through", excludeFromDirect: true };
  if (method === "Direct") return { direction: "direct", excludeFromDirect: false };
  return { direction: "to", excludeFromDirect: true };
}

export function isB2bOrderId(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith("B-") || trimmed.startsWith("#B-");
}

export function includeInSpinsView(row: Record<string, string>) {
  const text = Object.values(row).join(" ").toLowerCase();
  if (text.includes("4-pack") || text.includes("4 pack") || text.includes("4pk")) return false;
  const dollars = money(
    pick(row, ["dollar sales", "sales dollars", "dollars", "revenue", "amount", "total $", "total"]),
  );
  if (dollars !== null && dollars < 2000) return false;
  return true;
}

export function parseCsv(text: string) {
  const table = splitCsv(text.replace(/^\uFEFF/, ""));
  if (table.length < 2) return [];
  const headers = table[0].map((header) => header.trim());
  return table
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (!header) return;
        record[header] = row[index] ?? "";
      });
      return record;
    });
}

export function splitCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }

  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function chunk<T>(items: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}
