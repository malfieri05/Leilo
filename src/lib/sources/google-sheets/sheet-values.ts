/** Turn a Values API grid into text parsePromoCalendar / splitCsv already understand. */
export function valuesToCsv(values: string[][]): string {
  return values.map((row) => row.map(csvCell).join(",")).join("\n");
}

function csvCell(value: string) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export function a1Range(tabTitle: string, columns = "AZ") {
  const tab = tabTitle.replace(/'/g, "''");
  return `'${tab}'!A:${columns}`;
}

type SpreadsheetMeta = {
  sheets?: { properties?: { title?: string; sheetId?: number } }[];
};

export async function resolveSheetTitle(
  token: string,
  spreadsheetId: string,
  tabHint: { title?: string | null; gid?: number | null },
): Promise<string> {
  if (tabHint.title?.trim()) return tabHint.title.trim();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=sheets.properties`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`Could not read spreadsheet tabs (${response.status}).`);
  const body = (await response.json()) as SpreadsheetMeta;
  const sheets = body.sheets ?? [];

  if (tabHint.gid != null) {
    const match = sheets.find((sheet) => sheet.properties?.sheetId === tabHint.gid);
    const title = match?.properties?.title?.trim();
    if (title) return title;
    throw new Error(`No tab with gid ${tabHint.gid} on that spreadsheet.`);
  }

  const first = sheets[0]?.properties?.title?.trim();
  if (first) return first;
  throw new Error("That spreadsheet has no tabs.");
}