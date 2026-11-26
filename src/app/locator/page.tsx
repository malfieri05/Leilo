import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { LocatorView } from "@/components/locator-view";
import { loadLocatorTable } from "@/lib/store-locations";

export const metadata: Metadata = { title: "Store list" };

export default function LocatorPage() {
  return (
    <Suspense fallback={<Panel title="Doors"><p className="text-sm text-muted">Loading locations.</p></Panel>}>
      <LocatorBody />
    </Suspense>
  );
}

async function LocatorBody() {
  await connection();
  const report = await loadLocatorTable();
  if (report.state === "no-database") {
    return (
      <Panel title="Database">
        <p className="text-sm text-muted">Add DATABASE_URL to load the Leilo locations sheet.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Could not load locations">
        <p className="text-sm text-muted">{report.message}</p>
      </Panel>
    );
  }
  return <LocatorView report={report} />;
}