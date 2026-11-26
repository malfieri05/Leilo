"use client";

import { useId } from "react";

export function InfoTip({ text }: { text: string }) {
  const tipId = useId();
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-describedby={tipId}
        aria-label="About this view"
        className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-[11px] font-semibold italic leading-none text-muted transition-colors hover:border-heading hover:text-heading focus-visible:border-heading focus-visible:text-heading focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky"
      >
        i
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="pointer-events-none invisible absolute top-[calc(100%+0.55rem)] left-0 z-40 w-[min(22rem,calc(100vw-2.5rem))] rounded-xl border border-line bg-paper px-3.5 py-3 text-left text-sm leading-relaxed font-normal text-muted opacity-0 shadow-[0_16px_40px_rgba(15,23,42,0.12)] transition duration-150 ease-out group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
