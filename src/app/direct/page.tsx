import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Direct" };

export default function DirectPage() {
  return (
    <ScaffoldPage
      title="Direct"
      description="Wholesale orders placed with Leilo, mostly numbered #B- on Leilo Wholesale. Distributor-tagged orders stay out of this total and show as sales to the distributor."
      panels={[
        {
          title: "Direct orders",
          action: "Shopify · leilosupply",
          columns: ["Order", "Account", "Ship date", "Revenue", "Tags"],
          empty: "Waiting on the Leilo Wholesale connection. POS, merch, and sample tags stay on the order.",
        },
        {
          title: "Held out of Direct",
          action: "Distributor tags",
          columns: ["Order", "Method", "Direction", "Revenue", "Why excluded"],
          empty: "Orders tagged KEHE, UNFI, DSD, or distributor will land here instead of the Direct total.",
        },
      ]}
    />
  );
}
