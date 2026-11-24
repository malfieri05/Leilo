import { listDriveChildren, isSpinsDataFile, type DriveFile } from "@/lib/sources/google/drive-list";
import { readSpinsDriveFile } from "@/lib/sources/google/spins-drive-read";
import { GOOGLE_SCOPE, googleAccessToken, readServiceAccount } from "@/lib/sources/google/service-account";
import { parseSpinsExport } from "@/lib/sources/spins/parse-export";
import {
  classifySpinsDriveFile,
  isSpinsPeriodWeeks,
  isSpinsReportKind,
} from "@/lib/sources/spins/classify-drive-file";
import { SPINS_DRIVE_CATALOG } from "@/lib/sources/spins/drive-catalog";
import { spinsDriveFolderIds } from "@/lib/sources/spins/spins-connection";
import {
  reportLabel,
  SPINS_PERIOD_WEEKS,
  SPINS_REPORT_KINDS,
  spinsPartnerSlug,
  type SpinsPeriodWeeks,
  type SpinsReportKind,
} from "@/lib/sources/spins-model";
import type { PullResult } from "@/lib/sources/types";

export type SpinsDriveJob = {
  fileId: string;
  name: string;
  mimeType: string;
  reportKind: SpinsReportKind;
  periodWeeks: SpinsPeriodWeeks;
  modifiedTime: string;
};

type ManifestEntry = {
  fileId: string;
  report: string;
  weeks: number;
  name?: string;
};

export function missingSpinsDriveSlots(jobs: SpinsDriveJob[]) {
  const have = new Set(jobs.map((job) => spinsPartnerSlug(job.reportKind, job.periodWeeks)));
  const missing: string[] = [];
  for (const report of SPINS_REPORT_KINDS) {
    for (const weeks of SPINS_PERIOD_WEEKS) {
      const slug = spinsPartnerSlug(report, weeks);
      if (!have.has(slug)) missing.push(`${reportLabel(report)} · ${weeks}w`);
    }
  }
  return missing;
}

export async function planSpinsDriveJobs(): Promise<SpinsDriveJob[]> {
  const manifestOnly = loadManifest();
  if (manifestOnly) return manifestOnly;

  const account = readServiceAccount();
  const token = await googleAccessToken(account, [GOOGLE_SCOPE.drive, GOOGLE_SCOPE.sheets]);
  const folderIds = spinsDriveFolderIds();
  const spreadsheets: DriveFile[] = [];
  for (const folderId of folderIds) {
    const children = await listDriveChildren(token, folderId);
    spreadsheets.push(...children.filter(isSpinsDataFile));
  }

  const bySlug = new Map<string, SpinsDriveJob>();
  const skipped: string[] = [];

  for (const file of spreadsheets) {
    const target = classifySpinsDriveFile(file.name);
    if (!target) {
      skipped.push(file.name);
      continue;
    }
    const job = jobFromFile(file, target.reportKind, target.periodWeeks);
    const existing = bySlug.get(target.slug);
    if (!existing || existing.modifiedTime < file.modifiedTime) {
      bySlug.set(target.slug, job);
    }
  }

  applyCatalogPins(bySlug, spreadsheets);

  if (bySlug.size === 0 && spreadsheets.length > 0) {
    throw new Error(
      `Found ${spreadsheets.length} spreadsheets across ${folderIds.length} SPINS Drive folder(s) but none matched Brand Rank, Item Rank, or Sprouts filenames. Add GOOGLE_DRIVE_SPINS_MANIFEST or rename files to include report and week (for example \"SPINS Item Rank 12 week\"). Skipped: ${skipped.slice(0, 6).join("; ")}${skipped.length > 6 ? "…" : ""}`,
    );
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function pullSpinsDriveFile(job: SpinsDriveJob): Promise<PullResult> {
  const account = readServiceAccount();
  const token = await googleAccessToken(account, [GOOGLE_SCOPE.drive, GOOGLE_SCOPE.sheets]);
  const records = await readSpinsDriveFile(
    token,
    { id: job.fileId, name: job.name, mimeType: job.mimeType },
    account.client_email,
  );
  const parsed = parseSpinsExport(records, job.reportKind, job.periodWeeks);
  parsed.message = `${job.name}: ${parsed.message}`;
  parsed.raw.push({
    kind: "category",
    externalId: job.fileId,
    payload: {
      driveFile: job.name,
      modifiedTime: job.modifiedTime,
      partner: spinsPartnerSlug(job.reportKind, job.periodWeeks),
    },
  });
  return parsed;
}

function loadManifest(): SpinsDriveJob[] | null {
  const raw = process.env.GOOGLE_DRIVE_SPINS_MANIFEST?.trim();
  if (!raw) return null;
  let entries: ManifestEntry[];
  try {
    entries = JSON.parse(raw) as ManifestEntry[];
  } catch {
    throw new Error("GOOGLE_DRIVE_SPINS_MANIFEST is not valid JSON.");
  }
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error("GOOGLE_DRIVE_SPINS_MANIFEST must be a non-empty JSON array.");
  }
  return entries.map((entry, index) => {
    if (!entry.fileId?.trim() || !isSpinsReportKind(entry.report) || !isSpinsPeriodWeeks(Number(entry.weeks))) {
      throw new Error(`GOOGLE_DRIVE_SPINS_MANIFEST entry ${index + 1} needs fileId, report, and weeks (4, 12, 24, or 52).`);
    }
    return {
      fileId: entry.fileId.trim(),
      name: entry.name?.trim() || entry.fileId,
      mimeType: "application/vnd.google-apps.spreadsheet",
      reportKind: entry.report,
      periodWeeks: Number(entry.weeks) as SpinsPeriodWeeks,
      modifiedTime: new Date().toISOString(),
    };
  });
}

export function formatDriveFileList(files: DriveFile[]) {
  return files.filter(isSpinsDataFile).map((file) => file.name);
}

function jobFromFile(file: DriveFile, reportKind: SpinsReportKind, periodWeeks: SpinsPeriodWeeks): SpinsDriveJob {
  return {
    fileId: file.id,
    name: file.name,
    mimeType: file.mimeType,
    reportKind,
    periodWeeks,
    modifiedTime: file.modifiedTime,
  };
}

function applyCatalogPins(bySlug: Map<string, SpinsDriveJob>, files: DriveFile[]) {
  const byId = new Map(files.map((file) => [file.id, file]));
  for (const entry of SPINS_DRIVE_CATALOG) {
    const file = byId.get(entry.fileId);
    if (!file) continue;
    bySlug.set(spinsPartnerSlug(entry.report, entry.weeks), jobFromFile(file, entry.report, entry.weeks));
  }
}