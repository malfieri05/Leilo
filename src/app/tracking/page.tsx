import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { TrackingView } from "@/components/tracking-view";
import { loadTrackingOverview } from "@/lib/sources/tracking-overview";

export const metadata: Metadata = { title: "Sample / order tracking" };

export default function TrackingPage() {
  return (
    <Suspense fallback={<TrackingFallback />}>
      <TrackingBody />
    </Suspense>
  );
}

async function TrackingBody() {
  await connection();
  const report = await loadTrackingOverview();
  if (report.state === "no-database") {
    return (
      <Panel title="Tracking">
        <p className="text-sm text-muted">The database is not connected.</p>
      </Panel>
    );
  }
  if (report.state === "error") {
    return (
      <Panel title="Tracking">
        <p className="text-sm text-hibiscus">{report.message}</p>
      </Panel>
    );
  }
  return <TrackingView report={report} />;
}

function TrackingFallback() {
  return (
    <div className="flex flex-col gap-4">
      {["POS tracking", "Sample tracking", "LTL tracking"].map((title) => (
        <Panel key={title} title={title} action="Loading">
          <p className="text-sm text-muted">Loading</p>
        </Panel>
      ))}
    </div>
  );
}
