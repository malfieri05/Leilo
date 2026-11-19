import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { StoreMap } from "@/components/store-map";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <>
      <PageHeader
        title="Map"
        description="Retail doors from the public Leilo store locator. Search and region filters work on those doors. Date, source, and sales metrics are ready for Shopify and distributor data."
      />
      <StoreMap />
    </>
  );
}
