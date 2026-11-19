import { PageHeader } from "@/components/page-header";
import { Panel } from "@/components/panel";

type Card = { title: string; detail: string };

type PanelBlock = {
  title: string;
  action?: string;
  body?: string;
  columns?: string[];
  empty?: string;
  cards?: Card[];
};

export function ScaffoldPage({
  title,
  description,
  leading,
  panels,
}: {
  title: string;
  description: string;
  leading?: React.ReactNode;
  panels: PanelBlock[];
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      {leading}
      <div className="grid gap-4">
        {panels.map((panel) => (
          <Panel key={panel.title} title={panel.title} action={panel.action}>
            {panel.body ? <p className="mb-4 max-w-3xl text-sm text-muted">{panel.body}</p> : null}
            {panel.cards ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {panel.cards.map((card) => (
                  <li key={card.title} className="rounded-[10px] border border-line bg-cream px-4 py-3">
                    <p className="font-medium text-heading">{card.title}</p>
                    <p className="mt-1 text-sm text-muted">{card.detail}</p>
                  </li>
                ))}
              </ul>
            ) : null}
            {panel.columns ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.12em] text-muted">
                    <tr>
                      {panel.columns.map((column) => (
                        <th key={column} className="pb-3 font-medium">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-line">
                      <td colSpan={panel.columns.length} className="py-8 text-muted">
                        {panel.empty ?? "No rows yet."}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}
          </Panel>
        ))}
      </div>
    </>
  );
}
