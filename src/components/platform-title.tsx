"use client";

import { usePathname } from "next/navigation";
import { InfoTip } from "@/components/info-tip";
import { pageMetaFor, type PageMeta } from "@/lib/page-meta";

export function PlatformTitle() {
  return <TitleRow meta={pageMetaFor(usePathname())} />;
}

function TitleRow({ meta }: { meta: PageMeta }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <h1 className="truncate font-display text-xl tracking-tight text-heading md:text-2xl">{meta.title}</h1>
      {meta.description ? <InfoTip text={meta.description} /> : null}
    </div>
  );
}