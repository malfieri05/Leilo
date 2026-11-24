import { a1Range, resolveSheetTitle } from "@/lib/sources/google-sheets/sheet-values";
import { recordsFromPowerTabsGrid } from "@/lib/sources/spins/parse-powertabs-grid";

type SheetValues = { values?: string[][] };

export async function readSpreadsheetRecords(
  token: string,
  spreadsheetId: string,
  label: string,
  clientEmail: string,
) {
  const tab = await resolveSheetTitle(token, spreadsheetId, {});
  const range = a1Range(tab, "AZ");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 403 || response.status === 404) {
    throw new Error(`${label} could not be read (${response.status}). Share the sheet with ${clientEmail}.`);
  }
  if (!response.ok) throw new Error(`${label} request failed (${response.status}).`);
  const body = (await response.json()) as SheetValues;
  return recordsFromValues(body.values ?? []);
}

export function recordsFromValues(values: string[][]) {
  const powerTabs = recordsFromPowerTabsGrid(values);
  if (powerTabs) return powerTabs;

  if (values.length < 2) return [];
  const headers = values[0].map((header) => String(header ?? "").trim());
  return values
    .slice(1)
    .filter((row) => row.some((cell) => String(cell ?? "").trim()))
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (!header) return;
        record[header] = String(row[index] ?? "");
      });
      return record;
    });
}