import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/page-header";
import { StoreMap } from "@/components/store-map";
import { loadStoreLocations } from "@/lib/store-locations";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <>
      <PageHeader
        title="Map"
        description="Doors from the Leilo locations sheet when synced. Pins borrow Closeby coordinates until lat/lng live on the sheet. Default view is the full United States."
      />
      <MapBody />
    </>
  );
}

async function MapBody() {
  await connection();
  const bundle = await loadStoreLocations();
  return <StoreMap locations={bundle.locations} source={bundle.source} syncedAt={bundle.syncedAt} />;
}
