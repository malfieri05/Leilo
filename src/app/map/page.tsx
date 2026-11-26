import type { Metadata } from "next";
import { connection } from "next/server";
import { StoreMap } from "@/components/store-map";
import { loadStoreLocations } from "@/lib/store-locations";

export const metadata: Metadata = { title: "Map" };

export default function MapPage() {
  return (
    <MapBody />
  );
}

async function MapBody() {
  await connection();
  const bundle = await loadStoreLocations();
  return <StoreMap locations={bundle.locations} source={bundle.source} syncedAt={bundle.syncedAt} />;
}
