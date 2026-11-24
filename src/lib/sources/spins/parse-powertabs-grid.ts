const HEADER_MAP: Record<string, string> = {
  brands: "Brand",
  brand: "Brand",
  upc: "UPC",
  description: "Item Description",
  item: "Item",
  "item description": "Item Description",
  product: "Item Description",
  dollars: "Dollar Sales",
  units: "Unit Sales",
  "dollars % chg": "Dollar Sales % Chg",
  "units % chg": "Unit Sales % Chg",
  rank: "Rank",
  "brand rank": "Brand Rank",
  "item rank": "Item Rank",
  retailer: "Retailer",
  banner: "Retailer",
  geography: "Geography",
  state: "Geography",
};

/** SPINS portal PowerTabs xlsx/gsheet layout: title rows, then a header row, then data. */
export function recordsFromPowerTabsGrid(values: string[][]) {
  const headerIndex = values.findIndex((row) => isPowerTabsHeaderRow(row));
  if (headerIndex < 0) return null;

  const headers = values[headerIndex].map((cell) => mapHeader(String(cell ?? "")));
  const records: Record<string, string>[] = [];

  for (const row of values.slice(headerIndex + 1)) {
    if (!row.some((cell) => String(cell ?? "").trim())) continue;
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const value = String(row[index] ?? "").trim();
      if (!value) return;
      record[header] = value;
    });
    if (Object.keys(record).length === 0) continue;
    if (/^period:/i.test(record.Brand ?? record["Item Description"] ?? "")) continue;
    if ((record.Brand ?? "").toLowerCase() === "brands") continue;
    records.push(record);
  }

  return records.length > 0 ? records : null;
}

function isPowerTabsHeaderRow(row: string[]) {
  const cells = row.map((cell) => String(cell ?? "").trim().toLowerCase());
  const hasDollars = cells.includes("dollars") || cells.some((cell) => cell.includes("dollar sales"));
  if (!hasDollars) return false;
  if (cells.includes("brands") || cells.includes("brand")) return true;
  if (cells.includes("upc") && cells.includes("description")) return true;
  return false;
}

function mapHeader(raw: string) {
  const key = raw.trim().toLowerCase();
  if (!key) return "";
  return HEADER_MAP[key] ?? raw.trim();
}