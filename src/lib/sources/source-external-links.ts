import { dsdDriveFolderLink, dsdDriveLive } from "@/lib/sources/dsd/dsd-connection";
import { driveFolderUrl } from "@/lib/sources/google/drive-list";
import { feedSheetUrl, googleSheetEditUrl, GOOGLE_SHEET_FEEDS } from "@/lib/sources/google-sheet-feeds";
import { spinsApiLive, spinsDriveFolderId, spinsDriveLive } from "@/lib/sources/spins/spins-connection";

export type SourceInfoLink = { url: string; label: string };

function shopAdminUrl(): SourceInfoLink | null {
  const shop = process.env.SHOPIFY_SHOP?.trim() ?? "";
  if (!shop) return null;
  const host = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const domain = host.includes(".") ? host : `${host}.myshopify.com`;
  return { url: `https://${domain}/admin`, label: "Open Shopify admin" };
}

export function infoLinkForCatalogSource(source: string, partner: string): SourceInfoLink | null {
  switch (source) {
    case "shopify":
      return shopAdminUrl() ?? { url: "https://admin.shopify.com/", label: "Open Shopify admin" };
    case "hubspot":
      return { url: "https://app.hubspot.com/", label: "Open HubSpot" };
    case "zoominfo":
      return { url: "https://login.zoominfo.com/", label: "Open ZoomInfo" };
    case "shipstation":
      return { url: "https://ss.shipstation.com/", label: "Open ShipStation" };
    case "spins": {
      if (spinsDriveLive()) {
        return { url: driveFolderUrl(spinsDriveFolderId()), label: "Open SPINS Data Drive folder" };
      }
      if (spinsApiLive()) {
        const api = process.env.SPINS_API_URL?.trim();
        if (api?.startsWith("http")) return { url: api, label: "Open SPINS API" };
      }
      return { url: "https://www.spins.com/", label: "Open SPINS" };
    }
    case "dsd":
      return dsdDriveLive()
        ? { url: dsdDriveFolderLink(), label: "Open ALL SALES REPORTS folder" }
        : null;
    case "kehe":
      return { url: "https://connect.kehe.com/", label: "Open KEHE Connect" };
    case "unfi":
      return { url: "https://connect.unfi.com/", label: "Open UNFI Connect" };
    case "sku-pricelist": {
      const sku = process.env.GOOGLE_SHEET_SKU_ID?.trim();
      const url = sku ? googleSheetEditUrl(sku) : null;
      return url ? { url, label: "Open SKU Google Sheet" } : null;
    }
    case "promo-calendar": {
      const feed = GOOGLE_SHEET_FEEDS.find((item) => item.id === "promo");
      const url = feed ? feedSheetUrl(feed) : null;
      return url ? { url, label: "Open promotion calendar sheet" } : null;
    }
    case "dsd":
      return null;
    case "encompass":
      return { url: "https://www.encompass8.com/", label: "Open Encompass" };
    default:
      return null;
  }
}

export function infoLinkForGoogleSheetFeed(feedId: string): SourceInfoLink | null {
  const feed = GOOGLE_SHEET_FEEDS.find((item) => item.id === feedId);
  if (!feed) return null;
  const url = feedSheetUrl(feed);
  return url ? { url, label: `Open ${feed.name}` } : null;
}