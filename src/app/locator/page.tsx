import type { Metadata } from "next";
import Link from "next/link";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Store locator" };

export default function LocatorPage() {
  return (
    <>
      <ScaffoldPage
        title="Auto-Updating Store Locator"
        description="Doors the public site can point to. The store list is meant to refresh from the locator sheet, with region taken from the retailer address."
        panels={[
          {
            title: "Doors",
            action: "Locator sheet",
            columns: ["Store", "City", "Region", "Channel", "Last updated"],
            empty: "Share the store locator sheet with the service account. This list updates from that sheet.",
          },
        ]}
      />
      <p className="mt-4 text-sm text-muted">
        The draft map of known doors is still under{" "}
        <Link href="/map" className="text-heading underline">
          Current pages → Map
        </Link>
        .
      </p>
    </>
  );
}
