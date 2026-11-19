import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Promotion calendar" };

export default function PromosPage() {
  return (
    <ScaffoldPage
      title="Promotion Calendar"
      description="Planned windows by channel. A promo is not a sale until the ship date falls inside the window and the order is in the books."
      panels={[
        {
          title: "Upcoming windows",
          action: "Not scheduled",
          columns: ["Promotion", "Start", "End", "Channel", "SKU", "Owner"],
          empty: "No promotions are on the calendar yet.",
        },
      ]}
    />
  );
}
