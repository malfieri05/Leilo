"use client";

import { useRouter } from "next/navigation";
import { salesQueryString, type SalesQuery } from "@/lib/sources/sales-overview-model";

export function DsdPartnerFilter({
  query,
  options,
}: {
  query: SalesQuery;
  options: { slug: string; label: string }[];
}) {
  const router = useRouter();

  return (
    <label className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.12em] text-muted">
      Distributor
      <select
        value={query.partner ?? ""}
        onChange={(event) => {
          const partner = event.target.value || null;
          router.push(`/dsd${salesQueryString(query, { partner })}`);
        }}
        className="rounded-[10px] border border-line bg-paper px-3 py-1.5 text-sm normal-case tracking-normal text-ink"
      >
        <option value="">All DSD</option>
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
