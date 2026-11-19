import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "SKU data" };

export default function SkusPage() {
  return (
    <ScaffoldPage
      title="SKU Data / Information"
      description="The price and pack list the team sells from. The Google Sheet is the source. Case counts below are the standing rules."
      panels={[
        {
          title: "Standing case math",
          action: "Reference",
          cards: [
            { title: "4-pack case", detail: "24 cans." },
            { title: "Single-can case", detail: "12 cans." },
            { title: "KEHE can", detail: "$2.66." },
            { title: "DSD can / stick", detail: "$2.99 a can. $1.50 a stick." },
          ],
        },
        {
          title: "SKU list",
          action: "Sheet",
          columns: ["SKU", "Name", "Pack", "Cans per case", "Channel price"],
          empty: "Share the SKU sheet with the service account and add its id. Rows will replace this empty list.",
        },
      ]}
    />
  );
}
