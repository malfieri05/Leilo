import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { pipeline } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Pipeline" };

export default function PipelinePage() {
  return (
    <Panel title="Open opportunities" action="5 deals">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Account</th>
                <th className="pb-3 font-medium">Stage</th>
                <th className="pb-3 font-medium">Est. annual</th>
                <th className="pb-3 font-medium">Close</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.map((deal) => (
                <tr key={deal.account} className="border-t border-line">
                  <td className="py-3 font-medium">{deal.account}</td>
                  <td className="py-3">{deal.stage}</td>
                  <td className="py-3">{deal.value}</td>
                  <td className="py-3 text-muted">{deal.close}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
    </Panel>
  );
}
