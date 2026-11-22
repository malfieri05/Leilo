import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { SkusView } from "@/components/skus-view";
import { loadSkuCatalog } from "@/lib/sources/sku-overview";

export const metadata: Metadata = { title: "SKU data" };

export default function SkusPage() {
  return (
    <>
      <PageHeader
        title="SKU Data / Information"
        description="The B2B master price list: pack counts, UPCs, and FOB, delivered, and DSD prices. Supplement facts panels come later."
      />
      <Suspense fallback={<Panel title="SKU list"><p className="text-sm text-muted">Loading the master list.</p></Panel>}>
        <SkusFrame />
      </Suspense>
    </>
  );
}

async function SkusFrame() {
  await connection();
  const report = await loadSkuCatalog();
  if (report.state === "no-database") {
    return (
      <Panel title="Database">
        <p className="text-sm text-muted">Add DATABASE_URL to load the master list.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Could not load SKUs">
        <p className="text-sm text-muted">{report.message}</p>
      </Panel>
    );
  }
  return <SkusView report={report} />;
}
