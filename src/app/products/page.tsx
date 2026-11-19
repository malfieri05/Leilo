import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { flavorMix } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        title="Products"
        description="SKU mix for canned kava tonics. Placeholder shares until we hook sell-through by flavor."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {flavorMix.map((flavor) => (
          <Panel key={flavor.name} title={flavor.name} action={`${flavor.share}% mix`}>
            <div className="h-2 overflow-hidden rounded-full bg-foam">
              <div className={`h-full ${flavor.color}`} style={{ width: `${flavor.share * 4}%` }} />
            </div>
            <p className="mt-4 text-sm text-muted">
              Slot for velocity, out-of-stocks, and distributor inventory.
            </p>
          </Panel>
        ))}
      </div>
    </>
  );
}
