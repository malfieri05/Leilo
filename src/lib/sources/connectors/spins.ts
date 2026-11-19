import { includeInSpinsView } from "@/lib/sources/fields";
import { emptyPull } from "@/lib/sources/persist";
import type { PullResult } from "@/lib/sources/types";

export async function pullSpins(): Promise<PullResult> {
  const key = process.env.SPINS_API_KEY?.trim() ?? "";
  const endpoint = process.env.SPINS_API_URL?.trim() ?? "";
  if (!key || !endpoint) {
    return emptyPull(
      "SPINS API credentials are not both set. Upload the Brand Rank, Item Rank, or Sprouts extract instead.",
      true,
    );
  }

  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error(`SPINS refused the API key (${response.status}). Upload the extract if MyExtracts is not enabled.`);
  }
  if (!response.ok) throw new Error(`SPINS request failed (${response.status}).`);

  const payload = (await response.json()) as unknown;
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { rows?: unknown }).rows)
      ? ((payload as { rows: unknown[] }).rows ?? [])
      : [payload];
  const records = rows.filter((row): row is Record<string, string> => isRecord(row));
  const visible = records.filter((row) => includeInSpinsView(stringifyRow(row))).length;
  const result = emptyPull("");
  result.raw.push({
    kind: "category",
    externalId: "spins-api",
    payload: {
      visible,
      stored: rows.length,
      body: rows.slice(0, 2000),
    },
  });
  result.rowCount = rows.length;
  result.message = `SPINS returned ${rows.length} rows. ${visible} stay in SPINS views. 4-packs and items under $2,000 are left out of those views.`;
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringifyRow(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, String(value ?? "")]));
}
