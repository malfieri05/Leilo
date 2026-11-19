import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "DSD" };

export default function DsdPage() {
  return (
    <ScaffoldPage
      title="DSD"
      description="Direct-store delivery through named partners. Can price is $2.99. Stick price is $1.50. Rows come from a named file until a partner feed is granted."
      panels={[
        {
          title: "Partner deliveries",
          action: "File feed",
          columns: ["Partner", "Account", "Ship date", "Cases", "Revenue"],
          empty: "Upload the DSD Link export or the emailed spreadsheet on Sources.",
        },
        {
          title: "Case math",
          action: "Reference",
          cards: [
            { title: "4-pack case", detail: "24 cans." },
            { title: "Single-can case", detail: "12 cans." },
            { title: "Can", detail: "$2.99 on DSD." },
            { title: "Stick", detail: "$1.50 on DSD." },
          ],
        },
      ]}
    />
  );
}
