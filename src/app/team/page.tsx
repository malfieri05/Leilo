import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { team } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Team" };

export default function TeamPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
        {team.map((person) => (
          <Panel key={person.name} title={person.name} action={person.quota}>
            <p className="text-sm text-muted">
              {person.role} · {person.region}
            </p>
            <p className="mt-3 text-sm">Quota to date shown as a placeholder percentage.</p>
          </Panel>
        ))}
    </div>
  );
}
