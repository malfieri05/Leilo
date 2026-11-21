export function headerKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function pickColumn(row: Record<string, string>, names: string[]) {
  const wanted = new Set(names.map(headerKey));
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(headerKey(key))) return value ?? "";
  }
  return "";
}

export function recordsFromTable(table: string[][], headerIndex: number) {
  const headers = table[headerIndex]?.map((cell) => cell.trim()) ?? [];
  return table.slice(headerIndex + 1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = row[index]?.trim() ?? "";
    });
    return record;
  }).filter((row) => Object.values(row).some((cell) => cell.trim()));
}
