import type { Metadata } from "next";
import { KpiCard } from "@/components/kpi-card";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Sales Overview" };

export default function SalesOverviewPage() {
  return (
    <ScaffoldPage
      title="Sales Overview"
      description="One view of wholesale revenue. A sale lands in the period of its ship date. Direct totals leave out orders tagged for a distributor."
      leading={
        <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Direct" value="—" delta="Ship date · excludes distributor tags" tone="flat" />
          <KpiCard label="DSD" value="—" delta="Sales to the partner" tone="flat" />
          <KpiCard label="KEHE" value="—" delta="Sales through to the retailer" tone="flat" />
          <KpiCard label="UNFI" value="—" delta="Channel not active" tone="flat" />
        </div>
      }
      panels={[
          {
            title: "By ordering method",
            action: "Waiting on sync",
            columns: ["Method", "Direction", "Orders", "Revenue", "Ship window"],
            empty: "No synced orders yet. Direct, DSD, KEHE, and UNFI will split here once a source lands rows.",
          },
          {
            title: "Account health",
            action: "From last ship date",
            body: "Active is 90 days or less. At Risk is 91 to 150 days. Past is more than 150 days. Prospect has not ordered.",
            columns: ["Account", "Type", "Last ship", "Region", "Method"],
            empty: "Accounts appear after the first order or lead sync.",
          },
      ]}
    />
  );
}
