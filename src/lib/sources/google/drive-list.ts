const GOOGLE_SHEET_MIME = "application/vnd.google-apps.spreadsheet";
const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
};

type ListResponse = {
  files?: DriveFile[];
  nextPageToken?: string;
};

export async function listDriveChildren(token: string, folderId: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({
      q: `'${folderId.replace(/'/g, "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime)",
      pageSize: "200",
      orderBy: "modifiedTime desc",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 403 || response.status === 404) {
      throw new Error(
        `SPINS Drive folder could not be listed (${response.status}). Share the folder with the service account.`,
      );
    }
    if (!response.ok) throw new Error(`Drive list failed (${response.status}).`);
    const body = (await response.json()) as ListResponse;
    for (const file of body.files ?? []) {
      files.push(file);
    }
    pageToken = body.nextPageToken;
  } while (pageToken);

  return files;
}

export function isSpreadsheet(file: DriveFile) {
  return file.mimeType === GOOGLE_SHEET_MIME;
}

/** Google Sheets and Excel workbooks uploaded to Drive (SPINS ARK exports). */
export function isSpinsDataFile(file: DriveFile) {
  return file.mimeType === GOOGLE_SHEET_MIME || file.mimeType === EXCEL_MIME;
}

export function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId.trim())}`;
}