import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Lead Generation" };

export default function LeadsPage() {
  return (
    <ScaffoldPage
      title="Lead Generation"
      description="Prospects that have not ordered yet. This is the working list for new doors. It is separate from Active, At Risk, and Past accounts."
      panels={[
        {
          title: "Prospects",
          action: "Not ordered",
          columns: ["Account", "Region", "Channel fit", "Owner", "Last touch"],
          empty: "No lead list is connected. HubSpot companies marked Prospect will be the first source.",
        },
        {
          title: "Openers",
          action: "Pipeline",
          body: "A prospect becomes a deal when a first order or distributor setup is in motion. The earlier Pipeline page stays available under Current pages.",
          columns: ["Account", "Next step", "Target method", "Region"],
          empty: "No openers yet.",
        },
      ]}
    />
  );
}
