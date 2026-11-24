import { downloadDriveFile } from "@/lib/sources/google/drive-download";
import type { DriveFile } from "@/lib/sources/google/drive-list";
import { readSpreadsheetRecords } from "@/lib/sources/google/sheet-records";
import { recordsFromXlsx } from "@/lib/sources/google/xlsx-records";

const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function readSpinsDriveFile(
  token: string,
  file: Pick<DriveFile, "id" | "name" | "mimeType">,
  clientEmail: string,
) {
  if (file.mimeType === EXCEL_MIME) {
    const buffer = await downloadDriveFile(token, file.id);
    return recordsFromXlsx(buffer);
  }
  return readSpreadsheetRecords(token, file.id, file.name, clientEmail);
}