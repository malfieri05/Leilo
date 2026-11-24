import * as XLSX from "xlsx";
import { recordsFromValues } from "@/lib/sources/google/sheet-records";

export function recordsFromXlsx(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });
  const values = rows.map((row) => row.map((cell) => String(cell ?? "")));
  return recordsFromValues(values);
}