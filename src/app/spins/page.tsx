import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "SPINS Data" };

export default function SpinsPage() {
  return (
    <ScaffoldPage
      title="SPINS Data"
      description="Retail scan dollars and units. 4-packs and items under $2,000 stay out of this view so the chart matches how the team reads SPINS."
      panels={[
        {
          title: "Scan lines in view",
          action: "MyExtracts or file",
          columns: ["Retailer", "Item", "Dollars", "Units", "Period"],
          empty: "Upload a SPINS extract on Sources, or connect the Data Access API when MyExtracts is on.",
        },
        {
          title: "Held out of SPINS",
          action: "By rule",
          cards: [
            { title: "4-packs", detail: "Excluded from SPINS views." },
            { title: "Under $2,000", detail: "Items below this dollars line stay out of the view." },
          ],
        },
      ]}
    />
  );
}
