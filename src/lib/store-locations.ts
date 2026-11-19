import locations from "./leilo-stores.json";

/** Public store locator snapshot from leilo.com/pages/find-us, pulled 2026-11-18. */
export type StoreLocation = {
  id: number;
  name: string;
  address: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
};

export const storeLocations = locations as StoreLocation[];

export const storeRegions = [
  ...new Set(storeLocations.map((store) => store.region).filter(Boolean)),
].sort();
