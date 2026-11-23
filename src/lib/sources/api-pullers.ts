/** Sources with a live connector in runConnector (not file import). */
export const API_PULL_SOURCES = [
  "shopify",
  "hubspot",
  "zoominfo",
  "shipstation",
  "google_sheets",
  "spins",
] as const;

export function canApiSync(source: string) {
  return (API_PULL_SOURCES as readonly string[]).includes(source);
}