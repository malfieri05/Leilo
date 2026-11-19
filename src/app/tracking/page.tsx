import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Sample / order tracking" };

export default function TrackingPage() {
  return (
    <ScaffoldPage
      title="Sample / Order Tracking"
      description="Samples and shipped wholesale orders in one list. A tracking line stays relevant until 21 days after delivery."
      panels={[
        {
          title: "Open shipments",
          action: "ShipStation",
          columns: ["Reference", "Type", "Account", "Carrier", "Status", "Relevant until"],
          empty: "Connect ShipStation to list samples and orders. Type will read Sample or Order.",
        },
      ]}
    />
  );
}
