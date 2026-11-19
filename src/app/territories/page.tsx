import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";
import { territories } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Territories" };

export default function TerritoriesPage() {
  return (
    <>
      <PageHeader
        title="Territories"
        description="Regional revenue, door count, and a coarse velocity flag. Door locations are on the Map tab."
      />
      <Panel title="Regions" action="MTD">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-muted">
              <tr>
                <th className="pb-3 font-medium">Region</th>
                <th className="pb-3 font-medium">Revenue</th>
                <th className="pb-3 font-medium">Doors</th>
                <th className="pb-3 font-medium">Velocity</th>
              </tr>
            </thead>
            <tbody>
              {territories.map((row) => (
                <tr key={row.region} className="border-t border-line">
                  <td className="py-3 font-medium">{row.region}</td>
                  <td className="py-3">{row.revenue}</td>
                  <td className="py-3">{row.doors}</td>
                  <td className="py-3 capitalize text-muted">{row.velocity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
