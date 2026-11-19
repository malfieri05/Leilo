import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "KEHE" };

export default function KehePage() {
  return (
    <ScaffoldPage
      title="KEHE"
      description="Sales through KEHE to the retailer. Fill rate is cases shipped divided by cases ordered. The can price used here is $2.66."
      panels={[
        {
          title: "Fill rate",
          action: "CSV from Connect",
          columns: ["Retailer", "Cases ordered", "Cases shipped", "Fill rate", "Revenue"],
          empty: "Upload a Connect Supplier CSV on Sources. KEHE has no supplier API.",
        },
        {
          title: "Sales through",
          action: "To the retailer",
          columns: ["Retailer", "Region", "Ship date", "Cases", "Revenue"],
          empty: "Retailer rows from the KEHE file will list here, separate from Direct totals.",
        },
      ]}
    />
  );
}
