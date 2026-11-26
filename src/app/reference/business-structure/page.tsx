import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { Panel } from "@/components/panel";
import { MermaidDiagram } from "@/components/mermaid-diagram";

export const metadata: Metadata = {
  title: "Leilo business structure",
};

function diagramSource() {
  const path = join(process.cwd(), "docs/diagrams/leilo-business-structure.mmd");
  return readFileSync(path, "utf8");
}

export default function BusinessStructurePage() {
  const source = diagramSource();

  return (
    <>
      <Panel title="Diagram">
        <MermaidDiagram source={source} />
      </Panel>
      <Panel title="How to read it">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-heading">Solid boxes</dt>
            <dd className="mt-1 text-muted">People, paths, or who ships to whom.</dd>
          </div>
          <div>
            <dt className="font-semibold text-heading">Cylinder shapes</dt>
            <dd className="mt-1 text-muted">A system or file the team uses for data.</dd>
          </div>
          <div>
            <dt className="font-semibold text-heading">Dashed arrows</dt>
            <dd className="mt-1 text-muted">Where records live or which tool the team works in.</dd>
          </div>
          <div>
            <dt className="font-semibold text-heading">Invoice vs shelf</dt>
            <dd className="mt-1 text-muted">
              Shopify B2B for who Leilo bills; KEHE Connect / DSD Drive / email / Encompass for distributor sales to
              stores.
            </dd>
          </div>
        </dl>
      </Panel>
    </>
  );
}