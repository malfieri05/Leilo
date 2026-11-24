export type BrandKitDriveLink = {
  id: string;
  title: string;
  description: string;
  url: string;
  kind: "folder" | "file";
};

const DEFAULTS = {
  posMerchFolder: "1REsiXVn_XV7INMVhjSnMmmp8tsZPSn8t",
  brandAssetsFolder: "1rK86-J-4j85PNzPpu66fRGbaBwVosek5",
  brandKitZip: "1D6ilHdk3mO7YS_NUimloX7-sgV520hjx",
} as const;

function driveFolderUrl(id: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(id.trim())}`;
}

function driveFileUrl(id: string) {
  return `https://drive.google.com/file/d/${encodeURIComponent(id.trim())}/view`;
}

function envId(key: string, fallback: string) {
  return process.env[key]?.trim() || fallback;
}

/** External Google Drive shelves for the brand kit tab (links only, not ingested). */
export function brandKitDriveLinks(): BrandKitDriveLink[] {
  const posId = envId("GOOGLE_DRIVE_BRAND_POS_ID", DEFAULTS.posMerchFolder);
  const assetsId = envId("GOOGLE_DRIVE_BRAND_ASSETS_ID", DEFAULTS.brandAssetsFolder);
  const zipId = envId("GOOGLE_DRIVE_BRAND_KIT_ZIP_ID", DEFAULTS.brandKitZip);

  return [
    {
      id: "brand-assets",
      title: "Brand Assets",
      description:
        "Logos, the master brand kit archive, product photography, and the Optimized Sizing folder. Start here for decks and buyer-ready artwork.",
      url: driveFolderUrl(assetsId),
      kind: "folder",
    },
    {
      id: "pos-merch",
      title: "Current POS & Merch (2025)",
      description:
        "Postcards, shelf strips, wobblers, PDQ and shipper references, stickers, and in-store mockups the field team uses today.",
      url: driveFolderUrl(posId),
      kind: "folder",
    },
    {
      id: "brand-kit-zip",
      title: "Leilo Brand Kit (Sep 2026)",
      description:
        "Full downloadable brand kit (.zip). Use when you need everything in one package; preview is not available in Drive for large archives.",
      url: driveFileUrl(zipId),
      kind: "file",
    },
  ];
}