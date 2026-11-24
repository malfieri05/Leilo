import { dsdDriveLive } from "@/lib/sources/dsd/dsd-connection";

/** Sources with a live connector in runConnector (not file import). */
export const API_PULL_SOURCES = [
  "shopify",
  "hubspot",
  "zoominfo",
  "shipstation",
  "google_sheets",
  "spins",
  "dsd",
] as const;

export function canApiSync(source: string) {
  if (source === "dsd") return dsdDriveLive();
  return (API_PULL_SOURCES as readonly string[]).includes(source);
}