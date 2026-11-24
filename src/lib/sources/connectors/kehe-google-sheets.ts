import { a1Range, resolveSheetTitle, valuesToCsv } from "@/lib/sources/google-sheets/sheet-values";
import { GOOGLE_SCOPE, googleAccessToken, readServiceAccount } from "@/lib/sources/google/service-account";
import { parseKeheSalesFile } from "@/lib/sources/kehe/parse-sales-through";
import { parseKeheStockStatus } from "@/lib/sources/kehe/parse-stock-status";
import type { PullResult } from "@/lib/sources/types";

type SheetValues = { values?: string[][] };

export function keheSalesSheetConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && process.env.GOOGLE_SHEET_KEHE_SALES_ID?.trim(),
  );
}

export function keheStockSheetConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && process.env.GOOGLE_SHEET_KEHE_STOCK_ID?.trim(),
  );
}

function tabHint(prefix: "SALES" | "STOCK") {
  const gidRaw = process.env[`GOOGLE_SHEET_KEHE_${prefix}_GID`]?.trim() ?? "";
  const gid = gidRaw ? Number(gidRaw) : null;
  return {
    title: process.env[`GOOGLE_SHEET_KEHE_${prefix}_TAB`]?.trim() || null,
    gid: gid != null && Number.isFinite(gid) ? gid : null,
  };
}

export async function pullKeheSalesFromGoogleSheet(): Promise<PullResult> {
  const id = process.env.GOOGLE_SHEET_KEHE_SALES_ID?.trim() ?? "";
  if (!id) throw new Error("GOOGLE_SHEET_KEHE_SALES_ID is not set.");
  return pullKeheSheet(id, tabHint("SALES"), "KEHE sales-through", (text) => parseKeheSalesFile(text));
}

export async function pullKeheStockFromGoogleSheet(): Promise<PullResult> {
  const id = process.env.GOOGLE_SHEET_KEHE_STOCK_ID?.trim() ?? "";
  if (!id) throw new Error("GOOGLE_SHEET_KEHE_STOCK_ID is not set.");
  return pullKeheSheet(id, tabHint("STOCK"), "KEHE stock status", (text) => parseKeheStockStatus(text));
}

async function pullKeheSheet(
  spreadsheetId: string,
  tabHint: { title?: string | null; gid?: number | null },
  label: string,
  parse: (text: string) => PullResult,
): Promise<PullResult> {
  const account = readServiceAccount();
  const token = await googleAccessToken(account, [GOOGLE_SCOPE.sheets]);
  const tab = await resolveSheetTitle(token, spreadsheetId, tabHint);
  const values = await readSheet(token, spreadsheetId, account.client_email, label, a1Range(tab, "ZZ"));
  const csv = valuesToCsv(values);
  const result = parse(csv);
  result.message = `${label} from Google Sheet tab "${tab}": ${result.message}`;
  return result;
}

async function readSheet(token: string, id: string, email: string, label: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 403 || response.status === 404) {
    throw new Error(`${label} could not be read (${response.status}). Share the sheet with ${email} as Viewer.`);
  }
  if (!response.ok) throw new Error(`${label} request failed (${response.status}).`);
  const body = (await response.json()) as SheetValues;
  return body.values ?? [];
}