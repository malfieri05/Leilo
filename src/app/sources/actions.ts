"use server";

import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { importSourceFile, runConfiguredSources, runConnector } from "@/lib/sources/run";
import type { SyncState } from "@/lib/sources/types";

export async function syncSourceAction(_prev: SyncState, formData: FormData): Promise<SyncState> {
  await connection();
  const source = String(formData.get("source") ?? "");
  const result = source === "all" ? await runConfiguredSources() : await runConnector(source);
  revalidatePath("/sources");
  revalidatePath("/");
  revalidatePath("/direct");
  revalidatePath("/sales");
  revalidatePath("/spins");
  revalidatePath("/tracking");
  return result;
}

export async function importFileAction(_prev: SyncState, formData: FormData): Promise<SyncState> {
  await connection();
  const source = String(formData.get("source") ?? "");
  const partner = String(formData.get("partner") ?? "");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose a CSV or TSV file." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { ok: false, message: "That file is larger than 8 MB." };
  }
  const text = await file.text();
  const result = await importSourceFile({
    source,
    partner,
    filename: file.name,
    text,
    reportKind: String(formData.get("reportKind") ?? ""),
    periodWeeks: String(formData.get("periodWeeks") ?? ""),
  });
  revalidatePath("/sources");
  revalidatePath("/");
  revalidatePath("/kehe");
  revalidatePath("/unfi");
  revalidatePath("/direct");
  revalidatePath("/dsd");
  revalidatePath("/spins");
  revalidatePath("/skus");
  revalidatePath("/promos");
  revalidatePath("/tracking");
  return result;
}
