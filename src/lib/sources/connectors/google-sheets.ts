import { a1Range, resolveSheetTitle, valuesToCsv } from "@/lib/sources/google-sheets/sheet-values";
import { GOOGLE_SCOPE, googleAccessToken, readServiceAccount } from "@/lib/sources/google/service-account";
import { recordsFromValues } from "@/lib/sources/google/sheet-records";
import { emptyPull } from "@/lib/sources/persist";
import { ltlShipmentsFromRecords } from "@/lib/sources/ltl/parse-kehe-tab";
import { parseLocatorSheet } from "@/lib/sources/locator/parse-locator-sheet";
import { parsePromoCalendar } from "@/lib/sources/promo/parse-calendar";
import { sheetConnectorJobs } from "@/lib/sources/google-sheet-feeds";
import type { PullResult } from "@/lib/sources/types";

type SheetValues = { values?: string[][] };

const SHEETS = sheetConnectorJobs();

export async function pullGoogleSheets(): Promise<PullResult> {
  const account = readServiceAccount();
  const configured = SHEETS.filter((sheet) => process.env[sheet.env]?.trim());
  if (configured.length === 0) {
    return emptyPull(
      "The service account is set. Add sheet ids such as GOOGLE_SHEET_SKU_ID, GOOGLE_SHEET_LTL_ID, GOOGLE_SHEET_LOCATOR_ID, and GOOGLE_SHEET_PROMO_ID for documents shared to that account.",
      true,
    );
  }

  const token = await googleAccessToken(account, [GOOGLE_SCOPE.sheets, GOOGLE_SCOPE.drive]);
  const result = emptyPull("");
  const notes: string[] = [];

  for (const sheet of configured) {
    const id = process.env[sheet.env]?.trim() ?? "";
    if (sheet.kind === "promo") {
      const tab = await resolveSheetTitle(token, id, promoTabHint());
      const values = await readSheet(token, id, account.client_email, sheet.label, a1Range(tab, "AZ"));
      const parsed = parsePromoCalendar(valuesToCsv(values));
      result.promoEvents = parsed.promoEvents;
      result.promoSnapshot = parsed.promoSnapshot;
      result.raw.push(...parsed.raw);
      notes.push(`${sheet.label}: synced tab "${tab}" (${parsed.promoEvents?.length ?? 0} promotion cells).`);
      continue;
    }

    if (sheet.kind === "locator") {
      const tab = await resolveSheetTitle(token, id, locatorTabHint());
      const values = await readSheet(token, id, account.client_email, sheet.label, a1Range(tab, "AZ"));
      const records = recordsFromValues(values);
      const parsed = parseLocatorSheet(records);
      result.storeLocatorDoors = parsed.storeLocatorDoors;
      result.raw.push(...parsed.raw);
      notes.push(`${sheet.label}: synced tab "${tab}" (${parsed.storeLocatorDoors.length} doors).`);
      continue;
    }

    const range = sheet.kind === "shipment" ? ltlRange() : "A:Z";
    const values = await readSheet(token, id, account.client_email, sheet.label, range);
    const records = recordsFromValues(values);
    const kept = records.slice(0, 2000);
    result.raw.push({
      kind: sheet.kind,
      externalId: id,
      payload: { label: sheet.label, truncated: records.length > kept.length, rows: kept },
    });

    if (sheet.kind === "shipment") {
      const shipments = ltlShipmentsFromRecords(records);
      result.shipments.push(...shipments);
      notes.push(
        `${sheet.label}: ${records.length} rows on the ${ltlTabName()} tab, ${shipments.length} kept because the order id starts with #B-.`,
      );
    } else {
      notes.push(`${sheet.label}: ${records.length} rows stored as reference data.`);
    }
  }

  const promoCount = result.promoEvents?.length ?? 0;
  const doorCount = result.storeLocatorDoors?.length ?? 0;
  result.rowCount = result.shipments.length + result.raw.length + promoCount + doorCount;
  result.message = notes.join(" ");
  return result;
}

function locatorTabHint() {
  const gidRaw = process.env.GOOGLE_SHEET_LOCATOR_GID?.trim() ?? "";
  const gid = gidRaw ? Number(gidRaw) : null;
  return {
    title: process.env.GOOGLE_SHEET_LOCATOR_TAB?.trim() || null,
    gid: gid != null && Number.isFinite(gid) ? gid : null,
  };
}

function promoTabHint() {
  const gidRaw = process.env.GOOGLE_SHEET_PROMO_GID?.trim() ?? "";
  const gid = gidRaw ? Number(gidRaw) : null;
  return {
    title: process.env.GOOGLE_SHEET_PROMO_TAB?.trim() || null,
    gid: gid != null && Number.isFinite(gid) ? gid : null,
  };
}

function ltlTabName() {
  return process.env.GOOGLE_SHEET_LTL_TAB?.trim() || "Kehe";
}

function ltlRange() {
  const tab = ltlTabName().replace(/'/g, "''");
  return `'${tab}'!A:Z`;
}

async function readSheet(token: string, id: string, email: string, label: string, range: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 403 || response.status === 404) {
    throw new Error(
      `${label} could not be read (${response.status}). Share the sheet with ${email}.`,
    );
  }
  if (!response.ok) throw new Error(`${label} request failed (${response.status}).`);
  const body = (await response.json()) as SheetValues;
  return body.values ?? [];
}

