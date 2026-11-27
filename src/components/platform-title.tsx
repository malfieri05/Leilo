"use client";

import { usePathname } from "next/navigation";
import { InfoTip } from "@/components/info-tip";
import { pageMetaFor, type PageMeta } from "@/lib/page-meta";

export function PlatformTitle({ onDark = false }: { onDark?: boolean }) {
  return <TitleRow meta={pageMetaFor(usePathname())} onDark={onDark} />;
}

function TitleRow({ meta, onDark }: { meta: PageMeta; onDark: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <h1
        className={`truncate font-display text-xl tracking-tight md:text-2xl ${
          onDark ? "text-paper" : "text-heading"
        }`}
      >
        {meta.title}
      </h1>
      {meta.description ? <InfoTip text={meta.description} onDark={onDark} /> : null}
    </div>
  );
}