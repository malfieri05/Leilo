import { draftsFromFile } from "@/lib/sources/files";
import { dsdDriveFolderId } from "@/lib/sources/dsd/dsd-connection";
import { normalizePartnerName } from "@/lib/sources/dsd/partners";
import { isSpinsDataFile, listDriveChildren, type DriveFile } from "@/lib/sources/google/drive-list";
import { readSpinsDriveFile } from "@/lib/sources/google/spins-drive-read";
import { GOOGLE_SCOPE, googleAccessToken, readServiceAccount } from "@/lib/sources/google/service-account";
import type { PullResult } from "@/lib/sources/types";

const FOLDER_MIME = "application/vnd.google-apps.folder";

export type DsdDriveJob = {
  fileId: string;
  fileName: string;
  mimeType: string;
  modifiedTime: string;
  partnerSlug: string;
  folderName: string;
};

export function partnerSlugFromFolderName(folderName: string) {
  const base = folderName.split(" - ")[0]?.trim() || folderName;
  const trimmed = base.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  return normalizePartnerName(trimmed);
}

export async function planDsdDriveJobs(): Promise<DsdDriveJob[]> {
  const account = readServiceAccount();
  const token = await googleAccessToken(account, [GOOGLE_SCOPE.drive, GOOGLE_SCOPE.sheets]);
  const rootId = dsdDriveFolderId();
  const children = await listDriveChildren(token, rootId);
  const jobs: DsdDriveJob[] = [];

  for (const child of children) {
    if (child.mimeType === FOLDER_MIME) {
      const partnerSlug = partnerSlugFromFolderName(child.name);
      if (!partnerSlug) continue;
      const files = (await listDriveChildren(token, child.id)).filter(isSpinsDataFile);
      const best = pickNewest(files);
      if (!best) continue;
      jobs.push(jobFrom(best, partnerSlug, child.name));
      continue;
    }
    if (isSpinsDataFile(child) && !/^00\s*-/i.test(child.name)) {
      const partnerSlug = partnerSlugFromFolderName(child.name);
      if (partnerSlug) jobs.push(jobFrom(child, partnerSlug, child.name));
    }
  }

  return jobs.sort((a, b) => a.folderName.localeCompare(b.folderName));
}

export async function pullDsdDriveFile(job: DsdDriveJob): Promise<PullResult> {
  const account = readServiceAccount();
  const token = await googleAccessToken(account, [GOOGLE_SCOPE.drive, GOOGLE_SCOPE.sheets]);
  const records = await readSpinsDriveFile(
    token,
    { id: job.fileId, name: job.fileName, mimeType: job.mimeType },
    account.client_email,
  );
  const result = draftsFromFile("dsd", job.partnerSlug, records);
  result.message = `${job.folderName} (${job.fileName}): ${result.message}`;
  result.raw.push({
    kind: "reference",
    externalId: job.fileId,
    payload: { partner: job.partnerSlug, folder: job.folderName, file: job.fileName },
  });
  return result;
}

function jobFrom(file: DriveFile, partnerSlug: string, folderName: string): DsdDriveJob {
  return {
    fileId: file.id,
    fileName: file.name,
    mimeType: file.mimeType,
    modifiedTime: file.modifiedTime,
    partnerSlug,
    folderName,
  };
}

function pickNewest(files: DriveFile[]) {
  if (files.length === 0) return null;
  return [...files].sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))[0] ?? null;
}