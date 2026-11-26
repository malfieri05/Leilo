export type PageMeta = {
  title: string;
  description: string;
};

const pages: { href: string; title: string; description: string }[] = [
  {
    href: "/sales",
    title: "Sales Overview",
    description: "",
  },
  {
    href: "/",
    title: "Overview",
    description:
      "Synced revenue by ordering method is first. The cards and charts below stay labeled as sample data until that source has landed rows.",
  },
  {
    href: "/leads",
    title: "Lead Generation",
    description:
      "At Risk, Past, and upsell lists for KEHE, Direct, and DSD. Health is as of today. Competitor lookalikes wait on store lists.",
  },
  {
    href: "/spins",
    title: "SPINS Data",
    description:
      "Category scan dollars from Brand Rank, Item Rank, and the Sprouts item matrix. Sync from the SPINS Data Google Drive folder on Sources, or upload extracts. 4-packs and items under $2,000 stay out of the view.",
  },
  {
    href: "/brand",
    title: "Leilo Brand Kit / Marketing Materials",
    description:
      "The files the sales team hands a buyer. This shelf is for assets, not orders. Each section opens the live Google Drive folder or file the marketing team maintains.",
  },
  {
    href: "/skus",
    title: "SKU Data / Information",
    description:
      "The B2B master price list: pack counts, UPCs, and FOB, delivered, and DSD prices. Supplement facts panels come later.",
  },
  {
    href: "/promos",
    title: "Promotion Calendar",
    description: "KEHE and UNFI promotions in a two-month calendar, agenda list, or full matrix.",
  },
  {
    href: "/tracking",
    title: "Sample / Order Tracking",
    description:
      "POS, merch, and sample orders from ShipStation, plus LTL freight from the Kehe sheet. A shipment stays on this tab until 21 days after it is delivered.",
  },
  {
    href: "/locator",
    title: "Auto-Updating Store Locator",
    description:
      "Live doors from the company Leilo locations Google Sheet. Region comes from the retailer address; map pins need coordinates.",
  },
  {
    href: "/reference/business-structure",
    title: "Leilo business structure",
    description:
      "Org, four ordering methods, and where data lives today. Source: docs/diagrams/leilo-business-structure.mmd (from ARK Brain).",
  },
  {
    href: "/sources",
    title: "Sources",
    description:
      "Each system, how it connects, and the last time a sync succeeded. Credentials are created in the vendor admin and kept in environment variables. Staff portal passwords are not used.",
  },
  {
    href: "/map",
    title: "Map",
    description:
      "Doors from the Leilo locations sheet when synced. Pins borrow Closeby coordinates until lat/lng live on the sheet. Default view is the full United States.",
  },
  {
    href: "/pipeline",
    title: "Pipeline",
    description: "Deal board for new retail doors, expansions, and distributor programs. Stages and values are mock.",
  },
  {
    href: "/accounts",
    title: "Accounts",
    description: "Companies synced from HubSpot. Ordering method and industry come from the company properties.",
  },
  {
    href: "/products",
    title: "Products",
    description: "SKU mix for canned kava tonics. Placeholder shares until we hook sell-through by flavor.",
  },
  {
    href: "/territories",
    title: "Territories",
    description: "Regional revenue, door count, and a coarse velocity flag. Door locations are on the Map tab.",
  },
  {
    href: "/team",
    title: "Team",
    description: "Coverage and quota snapshot for the sales org. Names and numbers are invented for layout.",
  },
];

export function pageMetaFor(pathname: string): PageMeta {
  const match = [...pages]
    .sort((a, b) => b.href.length - a.href.length)
    .find((page) => (page.href === "/" ? pathname === "/" : pathname === page.href || pathname.startsWith(`${page.href}/`)));
  return match ?? { title: "Leilo", description: "" };
}