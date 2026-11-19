import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "UNFI" };

export default function UnfiPage() {
  return (
    <ScaffoldPage
      title="UNFI"
      description="Same file shape as KEHE: cases ordered, cases shipped, and sales through to the retailer. The channel is not turned on, so this view stays empty until a file arrives."
      panels={[
        {
          title: "Fill rate",
          action: "Not active",
          columns: ["Retailer", "Cases ordered", "Cases shipped", "Fill rate", "Revenue"],
          empty: "UNFI is unwired until the distributor is turned on. Upload will use the same inbox as KEHE.",
        },
      ]}
    />
  );
}
