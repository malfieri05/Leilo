import { Panel } from "@/components/panel";
import { brandKitDriveLinks } from "@/lib/brand-kit-drives";

export function BrandKitView() {
  const links = brandKitDriveLinks();

  return (
    <Panel title="Kit" action="Google Drive">
      <p className="mb-5 max-w-3xl text-sm text-muted">
        Assets live in the company Google Drive. Open a shelf below in a new tab; sign in with your Leilo Google account if
        Drive asks. These links do not sync into Sales HQ yet—they are hand-offs for the sales team.
      </p>
      <ul className="grid gap-4 lg:grid-cols-3">
        {links.map((item) => (
          <li
            key={item.id}
            className="flex flex-col rounded-[10px] border border-line bg-cream px-4 py-4"
          >
            <p className="font-medium text-heading">{item.title}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{item.description}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-line bg-paper px-4 py-2 text-sm font-medium text-heading transition hover:border-lagoon hover:bg-foam"
            >
              {item.kind === "folder" ? "Open folder in Drive" : "Open file in Drive"}
              <span aria-hidden className="text-muted">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}