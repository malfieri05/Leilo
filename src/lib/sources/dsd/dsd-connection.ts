import { googleServiceAccountConfigured } from "@/lib/sources/google/service-account";
import { driveFolderUrl } from "@/lib/sources/google/drive-list";

/** ALL SALES REPORTS — one subfolder per DSD partner (ARK Brain). */
const DEFAULT_DSD_REPORTS_FOLDER = "1oaDSJkEOTiYO-61gbZFQx068Rff9eN1P";

export function dsdDriveFolderId() {
  return process.env.GOOGLE_DRIVE_DSD_REPORTS_FOLDER_ID?.trim() || DEFAULT_DSD_REPORTS_FOLDER;
}

export function dsdDriveLive() {
  return googleServiceAccountConfigured() && Boolean(dsdDriveFolderId());
}

export function dsdDriveFolderLink() {
  return driveFolderUrl(dsdDriveFolderId());
}