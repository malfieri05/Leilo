import { parseDsdQuery } from "@/lib/sources/dsd-query";
import { parseSalesQuery, salesQueryString, type ChannelKey } from "@/lib/sources/sales-overview-model";

export const channelTitles: Record<ChannelKey, string> = {
  all: "All",
  direct: "Direct",
  kehe: "KEHE",
  dsd: "DSD",
  unfi: "UNFI",
};

export const channelDescriptions: Record<ChannelKey, string> = {
  all: "Shopify invoice view (sales to retailers and distributors). KEHE and DSD segments show sales through to stores. Revenue uses ship date; account health is retailer-only, as of today.",
  direct:
    "Retailers ordering from Leilo on leilosupply. KEHE, UNFI, and DSD invoices stay out, along with sample, POS, and merch tags. Independent and Regional Distributors stay out when HubSpot Industry Type says so.",
  kehe: "KEHE’s sales through to retailers, using shipped revenue. This is not Leilo’s invoice to KEHE. Fill rate is cases shipped divided by cases ordered.",
  dsd: "Retailer sales through DSD partners, from uploaded reports. This is not Leilo’s invoice to a distributor. Those Shopify orders stay on the All view.",
  unfi: "UNFI’s sales through to retailers, using the same data points as KEHE. This is not Leilo’s invoice to UNFI. The channel stays empty until a sales-through file is imported.",
};

export function salesChannelRedirect(
  channel: Exclude<ChannelKey, "all">,
  input: Record<string, string | string[] | undefined>,
) {
  if (channel === "dsd") {
    return `/sales${salesQueryString(parseDsdQuery({ ...input, channel: "dsd" }).query)}`;
  }
  const { query } = parseSalesQuery({ ...input, channel });
  return `/sales${salesQueryString(query)}`;
}